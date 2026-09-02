#!/usr/bin/env bash
#
# Installs the Agentic Planning Kit v3 into a consumer Git repository.
#
# Vendors the kit into <workspace>/<prefix>, merges the .gitignore and
# .gitattributes fragments into the consumer's ROOT files (they only work from
# the root), merges the CODEOWNERS fragment and installs the CI workflow with
# KIT_PATH already pointing at the installed prefix.
#
# Every generated section lives inside an idempotent managed block, so the
# script can be re-run with --refresh-only to refresh an installation without
# duplicating rules. The marker text is shared with install_kit.ps1: either
# script recognizes and refreshes a block written by the other.
#
# Files carrying a managed block are rewritten with LF endings throughout, in
# line with the kit's .gitattributes rules.
#
# The script never pushes. In subtree mode git itself creates one commit for
# the vendored kit; the merged fragments are left uncommitted for review.

set -euo pipefail

BLOCK_START='# >>> agentic-planning-v3 (managed by install_kit) >>>'
BLOCK_END='# <<< agentic-planning-v3 (managed by install_kit) <<<'

workspace=''
mode='subtree'
kit_source=''
kit_ref='main'
remote_name='planning-kit'
prefix='agentic-planning-kit'
codeowners_owner='@myteam'
refresh_only=0
skip_ci=0
skip_codeowners=0
force=0
dry_run=0

# ------------------------------------------------------------------ output ---

if [ -t 1 ]; then
    C_STEP=$'\033[36m'; C_OK=$'\033[32m'; C_NOTE=$'\033[90m'
    C_ALERT=$'\033[33m'; C_ERR=$'\033[31m'; C_OFF=$'\033[0m'
else
    C_STEP=''; C_OK=''; C_NOTE=''; C_ALERT=''; C_ERR=''; C_OFF=''
fi

step()  { printf '%s==> %s%s\n' "$C_STEP" "$1" "$C_OFF"; }
ok()    { printf '%s    %s%s\n' "$C_OK" "$1" "$C_OFF"; }
note()  { printf '%s    %s%s\n' "$C_NOTE" "$1" "$C_OFF"; }
alert() { printf '%s    %s%s\n' "$C_ALERT" "$1" "$C_OFF"; }
fail()  { printf '%sERROR %s%s\n' "$C_ERR" "$1" "$C_OFF" >&2; exit 1; }

usage() {
    cat <<'USAGE'
Usage: install_kit.sh --workspace PATH [options]

  --workspace PATH        Any path inside the consumer repository (required)
  --mode subtree|copy     subtree (default, updatable) or copy (snapshot)
  --kit-source URL|PATH   Kit repository to vendor (default: this kit; pass
                          https://github.com/pedro-aaron/agentic-planning-kit.git
                          to vendor upstream instead of your local copy)
  --kit-ref REF           Branch or tag to vendor (default: main)
  --remote-name NAME      Remote name for subtree mode (default: planning-kit)
  --prefix NAME           Install directory (default: agentic-planning-kit)
  --codeowners-owner OWN  Integrator team (default: @myteam)
  --refresh-only          Regenerate managed blocks; leave the kit untouched
  --skip-ci               Do not install the CI workflow
  --skip-codeowners       Do not touch CODEOWNERS
  --force                 Overwrite an existing workflow or snapshot
  --dry-run               Report intended changes only
  -h, --help              Show this help

Examples:
  ./install_kit.sh --workspace ~/src/my_workspace --dry-run
  ./install_kit.sh --workspace ~/src/my_workspace --codeowners-owner @acme-devs
USAGE
}

# ------------------------------------------------------------------- args ----

while [ $# -gt 0 ]; do
    # Accept both "--flag value" and "--flag=value".
    case "$1" in
        *=*) key="${1%%=*}"; value="${1#*=}"; has_inline=1 ;;
        *)   key="$1"; value="${2-}"; has_inline=0 ;;
    esac
    need_value() { [ -n "$value" ] || fail "$key requires a value"; }
    case "$key" in
        --workspace)        need_value; workspace="$value" ;;
        --mode)             need_value; mode="$value" ;;
        --kit-source)       need_value; kit_source="$value" ;;
        --kit-ref)          need_value; kit_ref="$value" ;;
        --remote-name)      need_value; remote_name="$value" ;;
        --prefix)           need_value; prefix="$value" ;;
        --codeowners-owner) need_value; codeowners_owner="$value" ;;
        --refresh-only)     refresh_only=1 ;;
        --skip-ci)          skip_ci=1 ;;
        --skip-codeowners)  skip_codeowners=1 ;;
        --force)            force=1 ;;
        --dry-run)          dry_run=1 ;;
        -h|--help)          usage; exit 0 ;;
        *)                  fail "unknown option: $key (see --help)" ;;
    esac
    case "$key" in
        --refresh-only|--skip-ci|--skip-codeowners|--force|--dry-run|-h|--help)
            shift ;;
        *)
            if [ "$has_inline" -eq 1 ]; then shift; else shift 2; fi ;;
    esac
done

[ -n "$workspace" ] || { usage >&2; fail 'missing required --workspace'; }
case "$mode" in
    subtree|copy) ;;
    *) fail "--mode must be 'subtree' or 'copy', got '$mode'" ;;
esac

# ---------------------------------------------------------------- helpers ----

abspath() { (cd "$1" >/dev/null 2>&1 && pwd -P); }

write_text_file() {
    # write_text_file PATH < content ; normalizes to LF and one trailing newline
    local path="$1" content
    content="$(cat)"
    if [ "$dry_run" -eq 1 ]; then
        note "[dry-run] would write $path"
        return 0
    fi
    mkdir -p "$(dirname "$path")"
    printf '%s\n' "$content" | tr -d '\r' > "$path"
}

# Drops the "copy me into your repo" instructions from a template fragment,
# then trims surrounding blank lines.
fragment_body() {
    tr -d '\r' < "$1" \
        | grep -v -E '^#[[:space:]]*(Merge (this fragment )?into|Copy into|Replace @|Adjust KIT_PATH)' \
        | awk 'NF {found=1} found {print}' \
        | awk '{lines[NR]=$0} END {last=NR; while (last>0 && lines[last]=="") last--; for (i=1;i<=last;i++) print lines[i]}'
}

merge_managed_block() {
    local path="$1" body="$2" label="$3"
    local block_file existing_body updated

    block_file="$(mktemp)"
    { printf '%s\n' "$BLOCK_START"; printf '%s\n' "$body"; printf '%s\n' "$BLOCK_END"; } > "$block_file"

    if [ ! -f "$path" ]; then
        ok "creating $label"
        write_text_file "$path" < "$block_file"
        rm -f "$block_file"
        return 0
    fi

    if grep -qxF "$BLOCK_START" "$path"; then
        updated="$(awk -v start="$BLOCK_START" -v end="$BLOCK_END" -v blockfile="$block_file" '
            $0 == start { inblock = 1; while ((getline line < blockfile) > 0) print line; close(blockfile); next }
            $0 == end   { inblock = 0; next }
            !inblock    { print }
        ' "$path" | tr -d '\r')"
        existing_body="$(tr -d '\r' < "$path")"
        if [ "$updated" = "$existing_body" ]; then
            note "$label already up to date"
        else
            ok "refreshing managed block in $label"
        fi
        printf '%s\n' "$updated" | write_text_file "$path"
    else
        ok "appending managed block to $label"
        existing_body="$(tr -d '\r' < "$path")"
        { printf '%s\n\n' "$existing_body"; cat "$block_file"; } | write_text_file "$path"
    fi
    rm -f "$block_file"
}

# -------------------------------------------------------------- preflight ----

step 'Preflight'

command -v git >/dev/null 2>&1 || fail 'git is not on PATH.'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
kit_root="$(dirname "$script_dir")"
[ -f "$kit_root/tools/agentic_planning_v3.py" ] \
    || fail "cannot locate the kit from $script_dir; run this script from the kit's tools/ directory."
[ -n "$kit_source" ] || kit_source="$kit_root"

[ -e "$workspace" ] || fail "workspace path does not exist: $workspace"

if ! top_level="$(git -C "$workspace" rev-parse --show-toplevel 2>/dev/null)"; then
    fail "$workspace is not inside a Git repository. Run 'git init' and make one commit first."
fi
root="$(abspath "$top_level")"

note "kit source:     $kit_source"
note "consumer root:  $root"
note "install prefix: $prefix"
note "mode:           $mode"
[ "$dry_run" -eq 1 ] && alert 'dry-run: no file or Git changes will be made'

if [ "$prefix" != 'agentic-planning-kit' ]; then
    alert "TRIGGERS.md and the prompts reference 'agentic-planning-kit/' literally."
    alert "Using prefix '$prefix' means every trigger block must be edited by hand."
fi

if kit_top="$(git -C "$kit_root" rev-parse --show-toplevel 2>/dev/null)"; then
    if [ "$(abspath "$kit_top")" = "$root" ]; then
        fail 'the workspace resolves to the kit repository itself; point --workspace at the consumer project.'
    fi
fi

target="$root/$prefix"

if [ "$refresh_only" -eq 1 ]; then
    [ -d "$target" ] || fail "--refresh-only needs an existing installation, but $prefix is not present in $root."
    note 'refresh-only: the vendored kit will not be touched'
elif [ "$mode" = 'subtree' ]; then
    git -C "$root" rev-parse --verify HEAD >/dev/null 2>&1 \
        || fail "git subtree needs at least one commit in $root. Commit something first, or use --mode copy."
    if [ -n "$(git -C "$root" status --porcelain 2>/dev/null)" ]; then
        fail "git subtree needs a clean working tree in $root. Commit or stash your changes first."
    fi
    if [ -e "$target" ]; then
        fail "$prefix already exists.
  Update the vendored kit:   git -C \"$root\" subtree pull --prefix $prefix $remote_name $kit_ref --squash
  Regenerate managed blocks: re-run this script with --refresh-only"
    fi
fi
if [ "$refresh_only" -eq 0 ] && [ "$mode" = 'copy' ] && [ -e "$target" ] && [ "$force" -eq 0 ]; then
    fail "$prefix already exists. Re-run with --force to overwrite the snapshot."
fi

# ------------------------------------------------------------ install kit ----

if [ "$refresh_only" -eq 1 ]; then
    step 'Kit install: skipped (--refresh-only)'
elif [ "$mode" = 'subtree' ]; then
    step "Installing the kit into $prefix"
    if git -C "$root" remote | grep -qxF "$remote_name"; then
        note "remote '$remote_name' already configured"
    elif [ "$dry_run" -eq 1 ]; then
        note "[dry-run] would run: git remote add $remote_name $kit_source"
    else
        git -C "$root" remote add "$remote_name" "$kit_source"
        ok "added remote '$remote_name' -> $kit_source"
    fi

    if [ "$dry_run" -eq 1 ]; then
        note "[dry-run] would run: git subtree add --prefix $prefix $remote_name $kit_ref --squash"
    else
        git -C "$root" fetch "$remote_name" "$kit_ref" >/dev/null
        git -C "$root" subtree add --prefix "$prefix" "$remote_name" "$kit_ref" --squash >/dev/null
        ok 'vendored via git subtree (one commit created)'
    fi
else
    step "Installing the kit into $prefix"
    if [ "$dry_run" -eq 1 ]; then
        note "[dry-run] would copy $kit_source -> $target (excluding .git)"
    else
        rm -rf "$target"
        mkdir -p "$target"
        tar -cf - -C "$kit_source" \
            --exclude='.git' --exclude='__pycache__' --exclude='.pytest_cache' . \
            | tar -xf - -C "$target"
        ok 'copied snapshot (no upstream update path)'
    fi
fi

# -------------------------------------------------------------- fragments ----

step 'Merging Git fragments into the consumer root'

ignore_fragment="$kit_root/templates/gitignore.agentic-planning-v3"
[ -f "$ignore_fragment" ] || fail 'missing templates/gitignore.agentic-planning-v3'
merge_managed_block "$root/.gitignore" "$(fragment_body "$ignore_fragment")" '.gitignore'

attr_fragment="$kit_root/templates/gitattributes.agentic-planning-v3"
[ -f "$attr_fragment" ] || fail 'missing templates/gitattributes.agentic-planning-v3'
merge_managed_block "$root/.gitattributes" "$(fragment_body "$attr_fragment")" '.gitattributes'

# ------------------------------------------------------------- CODEOWNERS ----

if [ "$skip_codeowners" -eq 1 ]; then
    step 'CODEOWNERS: skipped (--skip-codeowners)'
else
    step 'Merging CODEOWNERS'
    owners_fragment="$kit_root/templates/CODEOWNERS.agentic-planning-v3"
    [ -f "$owners_fragment" ] || fail 'missing templates/CODEOWNERS.agentic-planning-v3'
    owners_body="$(fragment_body "$owners_fragment")"
    owners_body="${owners_body//\/agentic-planning-kit\//\/$prefix\/}"
    if [ "$codeowners_owner" = '@myteam' ]; then
        note "using the default owner '@myteam'; pass --codeowners-owner to set your team handle."
    else
        owners_body="${owners_body//@myteam/$codeowners_owner}"
    fi
    merge_managed_block "$root/.github/CODEOWNERS" "$owners_body" '.github/CODEOWNERS'
fi

# --------------------------------------------------------------------- CI ----

if [ "$skip_ci" -eq 1 ]; then
    step 'CI workflow: skipped (--skip-ci)'
else
    step 'Installing the CI workflow'
    workflow_target="$root/.github/workflows/agentic-planning-v3.yml"
    if [ -f "$workflow_target" ] && [ "$force" -eq 0 ]; then
        alert 'workflow already exists; left untouched (re-run with --force to overwrite)'
    else
        workflow_source="$kit_root/templates/ci/github-actions-agentic-planning-v3.yml"
        [ -f "$workflow_source" ] || fail 'missing templates/ci/github-actions-agentic-planning-v3.yml'
        {
            printf '# Generated by %s/tools/install_kit. KIT_PATH points at the vendored kit.\n' "$prefix"
            fragment_body "$workflow_source" | sed -E "s|KIT_PATH:[[:space:]]*agentic-planning-kit|KIT_PATH: $prefix|"
        } | write_text_file "$workflow_target"
        [ "$dry_run" -eq 1 ] || ok 'wrote .github/workflows/agentic-planning-v3.yml'
    fi
fi

# ----------------------------------------------------------------- verify ----

step 'Verifying the control plane'

python_bin=''
for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1; then python_bin="$candidate"; break; fi
done

if [ -z "$python_bin" ]; then
    alert 'no local Python found; CI installs its own, but you cannot run the validator here.'
elif [ ! -f "$target/tools/agentic_planning_v3.py" ]; then
    note 'validator not present yet; skipping check'
elif "$python_bin" "$target/tools/agentic_planning_v3.py" --help >/dev/null 2>&1; then
    ok "validator responds: $python_bin $prefix/tools/agentic_planning_v3.py"
else
    alert 'validator did not respond; check the Python version (3.11+).'
fi

# ------------------------------------------------------------- next steps ----

step 'Next steps'
cat <<NEXT

  1. Review, commit and push the merged fragments (the installer never pushes):
       git -C "$root" status
       git -C "$root" add .gitignore .gitattributes .github
       git -C "$root" commit -m "Install agentic-planning-kit v3 control plane"
       git -C "$root" push

  2. Establish planning state from a session opened at the consumer root:
       greenfield  -> $prefix/TRIGGERS.md route 3 (PROPOSE)
       brownfield  -> $prefix/TRIGGERS.md route 1 (OBSERVE), then route 5
       existing v2 -> $prefix/TRIGGERS.md route M (PLAN)

  3. Only then protect main: no direct pushes, required checks, serialized
     merge/integration queue. The CI check fails until planning state exists,
     so enabling it earlier blocks every pull request. Set the CODEOWNERS
     owner to your team handle at the same time.

NEXT

if [ "$mode" = 'subtree' ]; then
    cat <<NEXT
  Update the kit later with:
       git -C "$root" subtree pull --prefix $prefix $remote_name $kit_ref --squash

NEXT
fi
