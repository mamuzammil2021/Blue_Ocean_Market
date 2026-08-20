# Blue Ocean Market V27.1.0

## Run locally
1. Extract the project.
2. Open Terminal in the project folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

## First checks
- Select **Excavator** in the workspace selector. The application should automatically open the Excavator dashboard.
- Confirm dashboard figures reflect existing machine/deal records.
- Open **Suppliers** and test the **Machines** button.
- Open **Buyers** and confirm it loads without remaining on Loading.
- Open a Sold / Completed machine and press **Sell / Sell Machine**. Existing sale data should load and the action should read **Update Sale**.
- Change a sale field and update it. Confirm the sale record is updated and only one active Finance entry exists for the sale source.
- Select an existing buyer in Sell Machine and confirm Sale Type automatically changes according to the buyer.
- Test **Approvals**, **People & Performance**, **Tasks** and **Work Reports** while switching business units.

## Important deployment note
SQLite and the local `uploads` directory require persistent storage for production use. Free/ephemeral hosting filesystems can lose database/uploads on restart or redeploy.
