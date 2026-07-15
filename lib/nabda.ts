import "server-only";

const NABDA_BASE_URL =
  "https://api.nabdaotp.com";

export async function getNabdaInstanceToken() {
  const instanceId =
    process.env.NABDA_INSTANCE_ID;

  if (!instanceId) {
    throw new Error(
      "Missing NABDA_INSTANCE_ID"
    );
  }

  const response = await fetch(
    `${NABDA_BASE_URL}/api/v1/auth/select-instance`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        instanceId,
      }),

      cache: "no-store",
    }
  );

  const text = await response.text();

  let result: any = null;

  try {
    result = JSON.parse(text);
  } catch {
    result = null;
  }

  if (!response.ok) {
    console.error(
      "NABDA select-instance failed:",
      response.status,
      text
    );

    throw new Error(
      "Could not authenticate with NABDA"
    );
  }

  const accessToken =
    result?.accessToken ||
    result?.data?.accessToken ||
    result?.token ||
    result?.data?.token;

  if (!accessToken) {
    console.error(
      "NABDA select-instance response has no access token:",
      text
    );

    throw new Error(
      "NABDA access token is missing"
    );
  }

  return String(accessToken);
}