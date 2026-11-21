# Relay · Workplace collaboration

Use Relay to message a teammate, keep replies with their project topic, and see who picked up the previous shift’s open work.

## Run the demo

You can try all three workflows with two browser tabs. The demo runs locally and needs no Nexconn credentials.

1. Install Node.js 22.12 or newer with npm. Check your version with `node -v`.
2. Open a terminal in the project folder (the one containing `package.json`). For a fresh checkout of this pre-release version, use:

   ```sh
   git clone --branch integration/workplace-collaboration https://github.com/MUSALREDDYGARIYAGNASREE/nexconn-workplace-collaboration.git
   cd nexconn-workplace-collaboration
   ```

3. Install the dependencies and start the app:

   ```sh
   npm ci
   npm run dev
   ```

4. Open the **Local** URL printed in the terminal, usually [localhost:5173](http://localhost:5173). You should see **Demo**, the user **alex**, and the **Studio launch** discussion.

Keep the terminal running while using Relay. Press **Ctrl+C** to stop. Next time, run `npm run dev` from the same folder.

## Try it as two teammates

Click **Open as Mina** in Alex’s sidebar. Keep both tabs in the same browser profile so they share the demo’s local message history.

| Workflow | In Alex’s tab | In Mina’s tab |
| --- | --- | --- |
| Direct message | Under **Direct messages**, select **mina**, type a message, and click **Send message**. | Select **alex** to read it and send a reply. |
| Project thread | Open **Studio launch**, enter a question under **New discussion**, and click **Post topic**. | Open **Studio launch** and click **Reply** beneath that question. Alex sees the reply under the same topic. |
| Shift handover | Open **Operations desk**, enter the incoming shift and summary, add any open items, and click **Publish handover**. | Open **Operations desk** and click **Acknowledge handover**. Alex sees Mina’s acknowledgment on the briefing. |

## Connect to live Nexconn chat

The **App Key** identifies your Nexconn application. Each teammate also needs a **user access token** issued for that same application. If you have only the App Key, you can already run the local demo above.

1. Register two test users and obtain their tokens through the Nexconn Server API. Keep the **App Secret** on the server side. [Nexconn Web SDK quickstart](https://docs.nexconn.ai/chatsdk-web)
2. Create two separate Nexconn groups, one for project threads and one for handovers. Add both users to both groups and keep the group IDs.
3. Open Relay in two separate browser profiles. In each, click **Connect Nexconn**, enter the shared App Key and that user’s access token, then click **Connect**. The sidebar shows **Live** and the connected user ID.
4. Use **+** beside **Direct messages** to enter the other user’s ID. In both profiles, use **+** beside **Project threads** and **Shift handover** to open the corresponding group IDs.

Live messages and history use the Nexconn Chat SDK. Reloading the page returns you to the demo. Choose **Connect Nexconn** to reconnect.

## Build and test

| Command | What it does |
| --- | --- |
| `npm run build` | Builds the production site in `dist/` for static hosting over HTTPS. |
| `npm test` | Starts a local test server and checks all three workflows in Chrome. Install Google Chrome first. The live test is skipped by default. |
| `npm run test:live` | Sends real test messages between two Nexconn accounts and checks both groups. Use dedicated test users and groups. |

For the live test, set these values in the Git-ignored `.env` beside `package.json`. The browser sign-in form takes credentials directly. The automated test reads them from this file.

```dotenv
NEXCONN_APP_KEY=
NEXCONN_USER_A_ID=
NEXCONN_USER_A_TOKEN=
NEXCONN_USER_B_ID=
NEXCONN_USER_B_TOKEN=
NEXCONN_PROJECT_GROUP_ID=
NEXCONN_HANDOVER_GROUP_ID=
```
