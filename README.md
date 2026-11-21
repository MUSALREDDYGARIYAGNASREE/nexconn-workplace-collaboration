# Relay workplace collaboration

Relay gives a team private conversations, project discussions with threaded replies, and a shift handover channel where an incoming teammate can acknowledge a briefing.

## Run locally

Use Node 22.12 or newer. Run `npm ci`, then `npm run dev` and open the URL Vite prints. For a production build, run `npm run build` and serve the contents of `dist/` over HTTPS.

The app opens in a browser-local demo as Alex. Choose **Open as Mina** to try the other side of a conversation in a second tab of the same browser profile. Demo messages persist in this browser and are visible to anyone with access to its local storage.

## Connect a team

1. Register two test users in the same Nexconn app and obtain their user access tokens. Create two group channels and add both users to each group. Use one group for project discussions and one for handovers.
2. In separate browser profiles, choose **Connect Nexconn**, enter the same app key and each teammate's own access token. Relay uses the user ID returned by Nexconn. The form accepts end-user tokens and keeps them in memory.
3. Use **+** beside Direct messages to open the other user's ID. Use the project and handover **+** controls to open the corresponding group IDs in both profiles.
4. Post a topic and select **Reply** beneath it. Publish a shift summary with open items, then acknowledge it as the incoming teammate.

Relay uses Nexconn direct and group channels for delivery and remote history. Replies and acknowledgments refer to their parent message ID in the text message's extra data. Use **Load earlier messages** for older pages. Reloading ends the local live session and requires reconnecting. User registration and group membership are managed in Nexconn.

[Nexconn Web SDK quickstart](https://docs.nexconn.ai/chatsdk-web)

## Verify workflows

With Chrome installed, run `npm test` for the two-tab demo. For the live test, put the following variables in a local, Git-ignored `.env` file and run `npm run test:live`. This sends test messages to the specified users and groups. Use dedicated test accounts and groups. The app itself never loads these variables into its client bundle.

```dotenv
NEXCONN_APP_KEY=
NEXCONN_USER_A_ID=
NEXCONN_USER_A_TOKEN=
NEXCONN_USER_B_ID=
NEXCONN_USER_B_TOKEN=
NEXCONN_PROJECT_GROUP_ID=
NEXCONN_HANDOVER_GROUP_ID=
```
