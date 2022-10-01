import type { User } from "@prisma/client";
import noop from "lodash/noop";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { NextRouter, useRouter } from "next/router";
import React, { Dispatch, Fragment, ReactNode, SetStateAction, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import dayjs from "@calcom/dayjs";
import CustomBranding from "@calcom/lib/CustomBranding";
import classNames from "@calcom/lib/classNames";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import useTheme from "@calcom/lib/hooks/useTheme";
import { trpc } from "@calcom/trpc/react";
import useMeQuery from "@calcom/trpc/react/hooks/useMeQuery";
import { SVGComponent } from "@calcom/types/SVGComponent";
import { Icon } from "@calcom/ui/Icon";

/* TODO: Get this from endpoint */
import ErrorBoundary from "../../ErrorBoundary";
// TODO: re-introduce in 2.1 import Tips from "../modules/tips/Tips";
import HeadSeo from "./head-seo";
import { SkeletonText } from "./skeleton";

/* TODO: Migate this */

export const ONBOARDING_INTRODUCED_AT = dayjs("September 1 2021").toISOString();

export const shouldShowOnboarding = (user: Pick<User, "createdDate" | "completedOnboarding">) => {
  return !user.completedOnboarding && dayjs(user.createdDate).isAfter(ONBOARDING_INTRODUCED_AT);
};

function useRedirectToLoginIfUnauthenticated(isPublic = false) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();

  useEffect(() => {
    if (isPublic) {
      return;
    }

    if (!loading && !session) {
      router.replace({
        pathname: "/auth/login",
        query: {
          callbackUrl: `${WEBAPP_URL}${location.pathname}${location.search}`,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, isPublic]);

  return {
    loading: loading && !session,
    session,
  };
}

function useRedirectToOnboardingIfNeeded() {
  const router = useRouter();
  const query = useMeQuery();
  const user = query.data;

  const isRedirectingToOnboarding = user && shouldShowOnboarding(user);

  useEffect(() => {
    if (isRedirectingToOnboarding) {
      router.replace({
        pathname: "/getting-started",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRedirectingToOnboarding]);
  return {
    isRedirectingToOnboarding,
  };
}

export function ShellSubHeading(props: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={classNames("mb-3 block justify-between sm:flex", props.className)}>
      <div>
        <h2 className="flex content-center items-center space-x-2 text-base font-bold leading-6 text-gray-900 rtl:space-x-reverse">
          {props.title}
        </h2>
        {props.subtitle && <p className="text-sm text-neutral-500 ltr:mr-4">{props.subtitle}</p>}
      </div>
      {props.actions && <div className="flex-shrink-0">{props.actions}</div>}
    </header>
  );
}

const Layout = (props: LayoutProps) => {
  const pageTitle = typeof props.heading === "string" ? props.heading : props.title;

  return (
    <>
      <HeadSeo
        title={pageTitle ?? "Cal.com"}
        description={props.subtitle ? props.subtitle?.toString() : ""}
        nextSeoProps={{
          nofollow: true,
          noindex: true,
        }}
      />
      <div>
        <Toaster position="bottom-right" />
      </div>

      <div className="flex h-screen overflow-hidden" data-testid="dashboard-shell">
        {props.SidebarContainer || <SideBarContainer />}
        <div className="flex w-0 flex-1 flex-col overflow-hidden">
          <MainContainer {...props} />
        </div>
      </div>
    </>
  );
};

type DrawerState = [isOpen: boolean, setDrawerOpen: Dispatch<SetStateAction<boolean>>];

type LayoutProps = {
  centered?: boolean;
  title?: string;
  heading?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  CTA?: ReactNode;
  large?: boolean;
  SettingsSidebarContainer?: ReactNode;
  MobileNavigationContainer?: ReactNode;
  SidebarContainer?: ReactNode;
  drawerState?: DrawerState;
  HeadingLeftIcon?: ReactNode;
  backPath?: string; // renders back button to specified path
  // use when content needs to expand with flex
  flexChildrenContainer?: boolean;
  isPublic?: boolean;
  withoutMain?: boolean;
};

const CustomBrandingContainer = () => {
  const { data: user } = useMeQuery();
  return <CustomBranding lightVal={user?.brandColor} darkVal={user?.darkBrandColor} />;
};

export default function Shell(props: LayoutProps) {
  useRedirectToLoginIfUnauthenticated(props.isPublic);
  useTheme("light");
  const { session } = useRedirectToLoginIfUnauthenticated(props.isPublic);
  if (!session && !props.isPublic) return null;

  return <Layout {...props} />;
}

export type NavigationItemType = {
  name: string;
  href: string;
  icon?: SVGComponent;
  child?: NavigationItemType[];
  pro?: true;
  onlyMobile?: boolean;
  onlyDesktop?: boolean;
  isCurrent?: ({
    item,
    isChild,
    router,
  }: {
    item: NavigationItemType;
    isChild?: boolean;
    router: NextRouter;
  }) => boolean;
};

const requiredCredentialNavigationItems = ["Routing Forms"];
const MORE_SEPARATOR_NAME = "more";
const navigation: NavigationItemType[] = [
  {
    name: "event_types_page_title",
    href: "/event-types",
    icon: Icon.FiLink,
  },
  {
    name: "bookings",
    href: "/bookings/upcoming",
    icon: Icon.FiCalendar,
  },
  {
    name: "availability",
    href: "/availability",
    icon: Icon.FiClock,
  },
];

const moreSeparatorIndex = navigation.findIndex((item) => item.name === MORE_SEPARATOR_NAME);
// We create all needed navigation items for the different use cases
const { desktopNavigationItems, mobileNavigationBottomItems, mobileNavigationMoreItems } = navigation.reduce<
  Record<string, NavigationItemType[]>
>(
  (items, item, index) => {
    // We filter out the "more" separator in desktop navigation
    if (item.name !== MORE_SEPARATOR_NAME) items.desktopNavigationItems.push(item);
    // Items for mobile bottom navigation
    if (index < moreSeparatorIndex + 1 && !item.onlyDesktop) items.mobileNavigationBottomItems.push(item);
    // Items for the "more" menu in mobile navigation
    else items.mobileNavigationMoreItems.push(item);
    return items;
  },
  { desktopNavigationItems: [], mobileNavigationBottomItems: [], mobileNavigationMoreItems: [] }
);

const Navigation = () => {
  return (
    <nav className="pl-4 pt-4">
      {desktopNavigationItems.map((item) => (
        <NavigationItem key={item.name} item={item} />
      ))}
    </nav>
  );
};

function useShouldDisplayNavigationItem(item: NavigationItemType) {
  const { status } = useSession();
  const { data: routingForms } = trpc.useQuery(["viewer.appById", { appId: "routing-forms" }], {
    enabled: status === "authenticated" && requiredCredentialNavigationItems.includes(item.name),
  });
  return !requiredCredentialNavigationItems.includes(item.name) || !!routingForms;
}

const defaultIsCurrent: NavigationItemType["isCurrent"] = ({ isChild, item, router }) => {
  return isChild ? item.href === router.asPath : router.asPath.startsWith(item.href);
};

const NavigationItem: React.FC<{
  item: NavigationItemType;
  isChild?: boolean;
}> = (props) => {
  const { item, isChild } = props;
  const { t, isLocaleReady } = useLocale();
  const router = useRouter();
  const isCurrent: NavigationItemType["isCurrent"] = item.isCurrent || defaultIsCurrent;
  const current = isCurrent({ isChild: !!isChild, item, router });
  const shouldDisplayNavigationItem = useShouldDisplayNavigationItem(props.item);

  if (!shouldDisplayNavigationItem) return null;

  return (
    <Fragment>
      <Link href={item.href}>
        <a
          aria-label={t(item.name)}
          className={classNames(
            "sellular-link group flex items-center px-4",
            isCurrent({ router, isChild, item }) && "sellular-link--active"
          )}
          aria-current={current ? "page" : undefined}>
          {isLocaleReady ? (
            <span className="inline">{t(item.name)}</span>
          ) : (
            <SkeletonText className="h-3 w-32" />
          )}
        </a>
      </Link>
      {item.child &&
        isCurrent({ router, isChild, item }) &&
        item.child.map((item) => <NavigationItem key={item.name} item={item} isChild />)}
    </Fragment>
  );
};

const MobileNavigationMoreItem: React.FC<{
  item: NavigationItemType;
  isChild?: boolean;
}> = (props) => {
  const { item } = props;
  const { t, isLocaleReady } = useLocale();
  const shouldDisplayNavigationItem = useShouldDisplayNavigationItem(props.item);

  if (!shouldDisplayNavigationItem) return null;

  return (
    <li className="border-b last:border-b-0" key={item.name}>
      <Link href={item.href}>
        <a className="flex items-center justify-between p-5 hover:bg-gray-100">
          <span className="flex items-center font-semibold text-gray-700 ">
            {item.icon && (
              <item.icon className="h-5 w-5 flex-shrink-0  ltr:mr-3 rtl:ml-3" aria-hidden="true" />
            )}
            {isLocaleReady ? t(item.name) : <SkeletonText />}
          </span>
          <Icon.FiArrowRight className="h-5 w-5 text-gray-500" />
        </a>
      </Link>
    </li>
  );
};

function SideBarContainer() {
  const { status } = useSession();
  const router = useRouter();
  // Make sure that Sidebar is rendered optimistically so that a refresh of pages when logged in have SideBar from the beginning.
  // This improves the experience of refresh on app store pages(when logged in) which are SSG.
  // Though when logged out, app store pages would temporarily show SideBar until session status is confirmed.
  if (status !== "loading" && status !== "authenticated") return null;
  return <SideBar />;
}

function SideBar() {
  return (
    <aside className="sellular-side-navbar shadow-navbar flex flex-col">
      <div className="sellular-section-title">CALENDAR</div>
      <Navigation />
    </aside>
  );
}

export function ShellMain(props: LayoutProps) {
  const router = useRouter();
  const { isLocaleReady } = useLocale();
  return (
    <>
      <div className="flex items-baseline sm:mt-0">
        {!!props.backPath && (
          <Icon.FiArrowLeft
            className="mr-3 hover:cursor-pointer"
            onClick={() => router.push(props.backPath as string)}
          />
        )}
        {props.heading && (
          <header className={classNames(props.large && "py-8", "mb-10 flex w-full items-center p-0")}>
            {props.HeadingLeftIcon && <div className="ltr:mr-4">{props.HeadingLeftIcon}</div>}
            <div className="block w-full ltr:mr-4 rtl:ml-4">
              {props.heading && (
                <h1 className="font-cal mb-1 text-xl capitalize tracking-wide text-black">
                  {!isLocaleReady ? <SkeletonText invisible /> : props.heading}
                </h1>
              )}
              {props.subtitle && (
                <p className="hidden text-sm text-neutral-500 sm:block">
                  {!isLocaleReady ? <SkeletonText invisible /> : props.subtitle}
                </p>
              )}
            </div>
            {props.CTA && (
              <div className="cta fixed right-4 bottom-[75px] z-40 flex-shrink-0 sm:relative  sm:bottom-auto sm:right-auto sm:z-0">
                {props.CTA}
              </div>
            )}
          </header>
        )}
      </div>
      <div className={classNames(props.flexChildrenContainer && "flex flex-1 flex-col")}>
        {props.children}
      </div>
    </>
  );
}

const SettingsSidebarContainerDefault = () => null;

function MainContainer({
  SettingsSidebarContainer: SettingsSidebarContainerProp = <SettingsSidebarContainerDefault />,
  ...props
}: LayoutProps) {
  const [sideContainerOpen, setSideContainerOpen] = props.drawerState || [false, noop];

  return (
    <main className="relative z-0 flex flex-1 flex-col overflow-y-auto bg-white focus:outline-none ">
      <div
        className={classNames(
          "absolute z-40 m-0 h-screen w-screen bg-black opacity-50",
          sideContainerOpen ? "" : "hidden"
        )}
        onClick={() => {
          setSideContainerOpen(false);
        }}
      />
      {SettingsSidebarContainerProp}
      <div className="px-4 py-2 lg:py-6 lg:px-10">
        <ErrorBoundary>
          {/* add padding to top for mobile when App Bar is fixed */}
          <div className="pt-14 sm:hidden" />
          {!props.withoutMain ? <ShellMain {...props}>{props.children}</ShellMain> : props.children}
        </ErrorBoundary>
      </div>
    </main>
  );
}

export const MobileNavigationMoreItems = () => (
  <ul className="mt-2 rounded-md border">
    {mobileNavigationMoreItems.map((item) => (
      <MobileNavigationMoreItem key={item.name} item={item} />
    ))}
  </ul>
);
