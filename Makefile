# Whetstone MCP Server — Makefile
# Usage: make <target>
# Run `make help` for available targets.

.PHONY: help install setup build dev test clean init \
        version release release-notes-preview release-notes-preview-noai gh-release npm-publish pr pr-preview \
        tool-reject tool-constrain tool-get-constraints tool-search \
        tool-applied tool-link tool-update-constraint tool-export tool-patterns tool-stats tool-list \
        dashboard

# ─── Colours ──────────────────────────────────────────────────────────

CYAN    = \033[36m
GREEN   = \033[32m
YELLOW  = \033[33m
DIM     = \033[2m
BOLD    = \033[1m
RESET   = \033[0m

# ─── Configuration ────────────────────────────────────────────────────

DB     ?= .whetstone/whetstone.db
SERVER  = WHETSTONE_DB=$(DB) node dist/index.js
INIT    = {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"make","version":"1.0"}}}

# ─── Help ─────────────────────────────────────────────────────────────

help: ## Show this help
	@printf '\n  $(BOLD)Whetstone$(RESET) $(DIM)v$(VERSION)$(RESET) — sharpen AI output by encoding human judgment\n\n'
	@awk 'BEGIN {FS = ":.*?## "} \
		/^##@/ { printf "\n  $(YELLOW)%s$(RESET)\n", substr($$0, 5) } \
		/^[a-zA-Z_-]+:.*?## / { printf "  $(CYAN)%-22s$(RESET) %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)
	@printf '\n  $(DIM)Examples:$(RESET)\n'
	@printf '    make tool-reject DOMAIN=backend DESC="Bad error handling"\n'
	@printf '    make tool-search QUERY=frontend\n'
	@printf '    make tool-applied ID=01ABC123\n\n'

##@ Build & Test

install: ## Install npm dependencies
	@printf '  $(GREEN)Installing dependencies...$(RESET)\n'
	@npm install

setup: install build ## Install, build, and link globally
	@npm link
	@printf '  $(GREEN)Linked whetstone-mcp globally.$(RESET)\n'

build: ## Compile TypeScript to dist/
	@printf '  $(GREEN)Building...$(RESET)\n'
	@npm run build --silent

dev: ## Watch mode — recompile on changes
	npm run dev

test: ## Run tests
	@printf '  $(GREEN)Running tests...$(RESET)\n'
	@npm test

clean: ## Remove dist/ and test database
	@rm -rf dist/
	@rm -f $(DB)
	@printf '  $(GREEN)Cleaned.$(RESET)\n'

init: build ## Set up .whetstone/ directory and database
	@node dist/index.js init

dashboard: build ## Start the web dashboard (PORT= optional)
	@WHETSTONE_DB=$(DB) node dist/index.js dashboard $(if $(PORT),--port $(PORT))

##@ Versioning

VERSION = $(shell node -p "require('./package.json').version")

version: ## Show current version
	@printf '  $(CYAN)v$(VERSION)$(RESET)\n'

release-notes-preview: ## Preview release notes (dry run, with Claude AI)
	@if [ -f .env ]; then set -a; . ./.env; set +a; fi; \
	node scripts/changelog.mjs preview --dry-run

release-notes-preview-noai: ## Preview release notes (dry run, without Claude AI)
	@node scripts/changelog.mjs preview --dry-run --noai

pr: ## Create a draft PR with AI-generated description (BASE= optional, default: develop)
	@if [ -f .env ]; then set -a; . ./.env; set +a; fi; \
	node scripts/draft-pr.mjs $(if $(BASE),--base=$(BASE))

pr-preview: ## Preview PR description without creating it
	@if [ -f .env ]; then set -a; . ./.env; set +a; fi; \
	node scripts/draft-pr.mjs --dry-run $(if $(BASE),--base=$(BASE))

release: ## Release: make release <patch|minor|major>
	@BUMP=$(filter patch minor major,$(MAKECMDGOALS)); \
	if [ -z "$$BUMP" ]; then \
		printf '  $(YELLOW)Usage: make release <patch|minor|major>$(RESET)\n'; \
		exit 1; \
	fi; \
	BRANCH=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$BRANCH" != "develop" ]; then \
		printf '  $(YELLOW)Must be on develop branch (currently on %s)$(RESET)\n' "$$BRANCH"; \
		exit 1; \
	fi; \
	if [ -n "$$(git status --porcelain)" ]; then \
		printf '  $(YELLOW)Working tree is dirty — commit or stash first$(RESET)\n'; \
		exit 1; \
	fi; \
	printf '  $(YELLOW)Current version: v$(VERSION)$(RESET)\n'; \
	npm run build --silent; \
	npm test --silent 2>/dev/null || (printf '  $(YELLOW)Tests failed — aborting release$(RESET)\n' && exit 1); \
	npm version $$BUMP --no-git-tag-version > /dev/null; \
	NEW_VERSION=$$(node -p "require('./package.json').version"); \
	RELEASE_BRANCH="release/$$NEW_VERSION"; \
	printf '  $(GREEN)Bumped to v%s$(RESET)\n' "$$NEW_VERSION"; \
	git checkout -b "$$RELEASE_BRANCH"; \
	if [ -f .env ]; then set -a; . ./.env; set +a; fi; \
	node scripts/changelog.mjs "$$NEW_VERSION"; \
	git add package.json package-lock.json CHANGELOG.md; \
	git commit -m "release: v$$NEW_VERSION"; \
	git checkout master; \
	git merge --no-ff "$$RELEASE_BRANCH" -m "Merge $$RELEASE_BRANCH into master"; \
	git tag -a "v$$NEW_VERSION" -m "v$$NEW_VERSION"; \
	printf '  $(GREEN)Tagged v%s on master$(RESET)\n' "$$NEW_VERSION"; \
	git checkout develop; \
	git merge --no-ff "$$RELEASE_BRANCH" -m "Merge $$RELEASE_BRANCH into develop"; \
	git branch -d "$$RELEASE_BRANCH"; \
	printf '\n  $(GREEN)Released v%s$(RESET)\n' "$$NEW_VERSION"; \
	printf '\n  $(DIM)Next steps:$(RESET)\n'; \
	printf '    git push origin master develop --tags\n'; \
	printf '    make gh-release\n'; \
	printf '    make npm-publish\n'

gh-release: ## Create GitHub release (TAG=vX.Y.Z or pick from list)
	@if [ -n "$(TAG)" ]; then \
		SELECTED="$(TAG)"; \
	else \
		RELEASED=$$(gh release list --limit 100 --json tagName --jq '.[].tagName' 2>/dev/null); \
		UNRELEASED=""; \
		for t in $$(git tag --sort=-v:refname); do \
			if ! echo "$$RELEASED" | grep -qx "$$t"; then \
				UNRELEASED="$$UNRELEASED $$t"; \
			fi; \
		done; \
		UNRELEASED=$$(echo $$UNRELEASED | xargs); \
		if [ -z "$$UNRELEASED" ]; then printf '  $(GREEN)All tags have GitHub releases$(RESET)\n'; exit 0; fi; \
		printf '\n  $(BOLD)Tags without GitHub releases:$(RESET)\n'; \
		i=1; for t in $$UNRELEASED; do printf '  $(CYAN)%d)$(RESET) %s\n' $$i $$t; i=$$((i+1)); done; \
		printf '\n  Select [1]: '; read choice; \
		if [ -z "$$choice" ]; then choice=1; fi; \
		SELECTED=$$(echo "$$UNRELEASED" | tr ' ' '\n' | sed -n "$${choice}p"); \
		if [ -z "$$SELECTED" ]; then printf '  $(YELLOW)Invalid selection$(RESET)\n'; exit 1; fi; \
	fi; \
	VERSION=$${SELECTED#v}; \
	NOTES=$$(awk "/^## \[$$VERSION\]/{found=1; next} /^## \[/{if(found) exit} found" CHANGELOG.md | sed '/^$$/d'); \
	if [ -z "$$NOTES" ]; then NOTES="Release $$SELECTED"; fi; \
	printf '  $(GREEN)Creating GitHub release %s$(RESET)\n' "$$SELECTED"; \
	gh release create "$$SELECTED" --title "$$SELECTED" --notes "$$NOTES"

npm-publish: ## Publish to npm registry
	@printf '  $(GREEN)Publishing whetstone-mcp@$(VERSION) to npm...$(RESET)\n'
	@npm publish --access public --auth-type=web
	@printf '  $(GREEN)Published!$(RESET) Install with: npm install -g @frontier-collective/whetstone-mcp\n'

# Catch patch/minor/major as no-op targets so make doesn't error
patch minor major:
	@true

##@ MCP Tools

DOMAIN ?= frontend
DESC   ?= Example rejection
RULE   ?= Example rule
TITLE  ?= Example constraint
QUERY  ?= example
ID     ?= (required)
RID    ?= (required)
FORMAT ?= markdown
STATUS ?= all

tool-reject: build ## Log a rejection (DOMAIN=, DESC=)
	@printf '  $(YELLOW)reject$(RESET) $(DIM)domain=$(DOMAIN)$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"reject","arguments":{"domain":"$(DOMAIN)","description":"$(DESC)"}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs

tool-constrain: build ## Create a constraint (DOMAIN=, TITLE=, RULE=)
	@printf '  $(YELLOW)constrain$(RESET) $(DIM)domain=$(DOMAIN)$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"constrain","arguments":{"domain":"$(DOMAIN)","category":"pattern","title":"$(TITLE)","rule":"$(RULE)"}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs

tool-get-constraints: build ## Get active constraints (DOMAIN= optional)
	@printf '  $(YELLOW)get_constraints$(RESET) $(DIM)domain=$(DOMAIN)$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_constraints","arguments":{"domain":"$(DOMAIN)"}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs

tool-search: build ## Search constraints and rejections (QUERY=)
	@printf '  $(YELLOW)search$(RESET) $(DIM)query=$(QUERY)$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search","arguments":{"query":"$(QUERY)"}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs

tool-applied: build ## Mark constraint as applied (ID= required)
	@printf '  $(YELLOW)applied$(RESET) $(DIM)id=$(ID)$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"applied","arguments":{"constraint_id":"$(ID)"}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs

tool-link: build ## Link rejections to a constraint (ID=, RID= required)
	@printf '  $(YELLOW)link$(RESET) $(DIM)constraint=$(ID) rejection=$(RID)$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"link","arguments":{"constraint_id":"$(ID)","rejection_ids":["$(RID)"]}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs

tool-update-constraint: build ## Update a constraint (ID= required, TITLE=, RULE=)
	@printf '  $(YELLOW)update_constraint$(RESET) $(DIM)id=$(ID)$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"update_constraint","arguments":{"id":"$(ID)","title":"$(TITLE)"}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs

tool-export: build ## Export constraints (DOMAIN= optional, FORMAT=markdown|json)
	@printf '  $(YELLOW)export$(RESET) $(DIM)format=$(FORMAT)$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"export","arguments":{"format":"$(FORMAT)"}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs

tool-patterns: build ## Surface recurring rejection patterns (DOMAIN= optional)
	@printf '  $(YELLOW)patterns$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"patterns","arguments":{}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs

tool-list: build ## List rejections (DOMAIN=, STATUS=encoded|unencoded|all)
	@printf '  $(YELLOW)list$(RESET) $(DIM)domain=$(DOMAIN) status=$(STATUS)$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list","arguments":{"domain":"$(DOMAIN)","status":"$(STATUS)"}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs

tool-stats: build ## Get rejection and constraint statistics
	@printf '  $(YELLOW)stats$(RESET)\n'
	@printf '%s\n%s\n' \
		'$(INIT)' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"stats","arguments":{}}}' \
	| $(SERVER) 2>/dev/null | tail -1 | node scripts/format-response.mjs
