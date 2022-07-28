import { get } from "lodash";
import { GetServerSidePropsContext } from "next";
import { getCsrfToken, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";

import { ErrorCode, getSession } from "@lib/auth";
import { WEBAPP_URL, WEBSITE_URL } from "@lib/config/constants";
import { useLocale } from "@lib/hooks/useLocale";
import { hostedCal, isSAMLLoginEnabled, samlProductID, samlTenantID } from "@lib/saml";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@lib/telemetry";
import { inferSSRProps } from "@lib/types/inferSSRProps";

import { IS_GOOGLE_LOGIN_ENABLED } from "@server/lib/constants";
import { ssrInit } from "@server/lib/ssr";

interface LoginValues {
  email: string;
  password: string;
  totpCode: string;
  csrfToken: string;
}

export default function Login({ csrfToken }: inferSSRProps<typeof getServerSideProps>) {
  const router = useRouter();
  const { t } = useLocale();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errorMessages: { [key: string]: string } = {
    // [ErrorCode.SecondFactorRequired]: t("2fa_enabled_instructions"),
    [ErrorCode.InvalidJwtToken]: `Invalid Plivo JWT token.`,
    [ErrorCode.JwtTokenMissing]: `Plivo JWT token is missing`,
    [ErrorCode.UserNotFound]: t("no_account_exists"),
    [ErrorCode.IncorrectTwoFactorCode]: `${t("incorrect_2fa_code")} ${t("please_try_again")}`,
    [ErrorCode.InternalServerError]: `${t("something_went_wrong")} ${t("please_try_again_and_contact_us")}`,
    [ErrorCode.ThirdPartyIdentityProviderEnabled]: t("account_created_with_identity_provider"),
  };

  const telemetry = useTelemetry();

  let callbackUrl = typeof router.query?.callbackUrl === "string" ? router.query.callbackUrl : "";
  const token = router.query.token || "";

  if (/"\//.test(callbackUrl)) callbackUrl = callbackUrl.substring(1);

  // If not absolute URL, make it absolute
  if (!/^https?:\/\//.test(callbackUrl)) {
    callbackUrl = `${WEBAPP_URL}/${callbackUrl}`;
  }

  const safeCallbackUrl = getSafeRedirectUrl(callbackUrl);

  callbackUrl = safeCallbackUrl || "";
  useEffect(() => {
    telemetry.event(telemetryEventTypes.login, collectPageParameters());
    signIn<"credentials">("credentials", {
      token,
      callbackUrl,
      redirect: false,
    }).then((res) => {
      if (!res) setErrorMessage(errorMessages[ErrorCode.InternalServerError]);
      // we're logged in! let's do a hard refresh to the desired url
      else if (!res.error) router.push(callbackUrl);
      else {
        console.log(res);
        setErrorMessage(errorMessages[get(res, "error", ErrorCode.InternalServerError)]);
      }
    });
  }, [token, callbackUrl, router, setErrorMessage, telemetry, errorMessages]);

  return <div>{errorMessage ? errorMessage : ""}</div>;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req } = context;
  const session = await getSession({ req });
  const ssr = await ssrInit(context);

  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      csrfToken: await getCsrfToken(context),
      trpcState: ssr.dehydrate(),
      isGoogleLoginEnabled: IS_GOOGLE_LOGIN_ENABLED,
      isSAMLLoginEnabled,
      hostedCal,
      samlTenantID,
      samlProductID,
    },
  };
}
