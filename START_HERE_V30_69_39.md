# Blue Ocean Market V30.69.39

This release implements the fixes in **QA POINTS 20 oct.docx** on the verified V30.69.38 protected source.

- Full-page Packaging Purchase cart, one supplier and multiple materials.
- Material category/unit dropdowns with Other/custom values.
- Current Materials list after deletion; retired Packaging card renderer removed from the active application.
- One server-backed Raw Salt Stock search.
- Clear import advance settlements, supplier allocations and linked import history.
- No startup duplicate consolidation/automatic Finance voiding; Accounting reversals remain controlled.

Start with `V30_69_39_IMPLEMENTATION_AND_QA.md`. Use `V30_69_39_MAC_GIT_NEW_BRANCH.md` to push a new branch, and `V30_69_39_DEPLOYMENT_NOTES.md` for Render testing and backup/rollback steps.

Runtime: **Node 22**. Confirm `node -p "require('./package.json').version"` prints **30.69.39**. Do not use an older ZIP or reset the Render disk/database.
