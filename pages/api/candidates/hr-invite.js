// pages/api/candidates/hr-invite.js
import nextConnect from "next-connect";
import { apiProxyHandler } from "../../../server/apiProxy"; 
// ^ or whatever helper you already use to proxy to Express
// If you don't have a helper, use a simple fetch to http://localhost:PORT/...

const handler = nextConnect();

// POST /api/candidates/hr-invite?applicationId=...
handler.post(async (req, res) => {
  const { applicationId } = req.query;

  const backendRes = await apiProxyHandler(req, {
    path: `/api/candidates/${encodeURIComponent(applicationId)}/hr-invite`,
    method: "POST",
  });

  res.status(backendRes.status).json(backendRes.body);
});

export default handler;
