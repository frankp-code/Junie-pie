import * as functions from 'firebase-functions';
import * as cors from 'cors';

const corsHandler = cors({ origin: true });

export const verifyPasscode = functions.https.onRequest((request, response) => {
  corsHandler(request, response, () => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    const { passcode } = request.body;
    const correctPasscode = process.env.APP_PASSCODE;

    if (!correctPasscode) {
        console.error("APP_PASSCODE environment variable not set.");
        response.status(500).json({ success: false, message: 'Server configuration error.' });
        return;
    }

    if (passcode === correctPasscode) {
      response.status(200).json({ success: true });
    } else {
      response.status(401).json({ success: false, message: 'Invalid passcode' });
    }
  });
});
