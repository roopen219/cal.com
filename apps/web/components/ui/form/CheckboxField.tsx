import React, { forwardRef, InputHTMLAttributes } from "react";

import classNames from "@calcom/lib/classNames";

import InfoBadge from "@components/ui/InfoBadge";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  description: string;
  descriptionAsLabel?: boolean;
  informationIconText?: string;
};

const CheckboxField = forwardRef<HTMLInputElement, Props>(
  ({ label, description, informationIconText, ...rest }, ref) => {
    const descriptionAsLabel = !label || rest.descriptionAsLabel;
    return (
      <div className="block items-center sm:flex">
        {label && (
          <div className="min-w-48 mb-4 sm:mb-0">
            {React.createElement(
              descriptionAsLabel ? "div" : "label",
              {
                className: "flex text-sm sellular-input-label !pb-0 cursor-pointer",
                ...(!descriptionAsLabel
                  ? {
                      htmlFor: rest.id,
                    }
                  : {}),
              },
              label
            )}
          </div>
        )}
        <div className="w-full">
          <div className="relative flex items-start">
            {React.createElement(
              descriptionAsLabel ? "label" : "div",
              {
                className: classNames(
                  "relative flex items-start",
                  descriptionAsLabel ? "text-neutral-700" : "text-neutral-900"
                ),
              },
              <>
                <div className="flex h-5 items-center">
                  <input
                    {...rest}
                    ref={ref}
                    type="checkbox"
                    className="text-brand hover:border-brand h-4 w-4 cursor-pointer rounded border-gray-500 focus:outline-none focus:ring-transparent"
                  />
                </div>
                <span className="cursor-pointer text-sm text-gray-500 ltr:ml-2 rtl:mr-2">{description}</span>
              </>
            )}
            {informationIconText && <InfoBadge content={informationIconText} />}
          </div>
        </div>
      </div>
    );
  }
);

CheckboxField.displayName = "CheckboxField";

export default CheckboxField;
