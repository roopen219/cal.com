import Link from "next/link";
import { useRouter } from "next/router";
import { ComponentProps } from "react";

import classNames from "@calcom/lib/classNames";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { SVGComponent } from "@calcom/types/SVGComponent";

import { SkeletonText } from "../../skeleton";

export type HorizontalTabItemProps = {
  name: string;
  disabled?: boolean;
  className?: string;
  href: string;
  linkProps?: Omit<ComponentProps<typeof Link>, "href">;
  icon?: SVGComponent;
};

const HorizontalTabItem = function ({ name, href, linkProps, ...props }: HorizontalTabItemProps) {
  const { t, isLocaleReady } = useLocale();
  const { asPath } = useRouter();
  const isCurrent = asPath.startsWith(href);

  return (
    <Link key={name} href={href} {...linkProps}>
      <a
        className={classNames(
          isCurrent && "sellular-tab--active",
          "sellular-tab",
          props.disabled && "pointer-events-none !opacity-30",
          props.className
        )}
        aria-current={isCurrent ? "page" : undefined}>
        {props.icon && (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          <props.icon
            className={classNames(
              isCurrent ? "text-brand" : "text-gray-700",
              "-ml-0.5 hidden h-4 w-4 ltr:mr-2 rtl:ml-2 sm:inline-block"
            )}
            aria-hidden="true"
          />
        )}
        {isLocaleReady ? t(name) : <SkeletonText className="h-4 w-24" />}
      </a>
    </Link>
  );
};

export default HorizontalTabItem;
