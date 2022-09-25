import { EventTypeCustomInput, EventTypeCustomInputType } from "@prisma/client";
import React, { FC } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";

import Button from "@calcom/ui/Button";

import { useLocale } from "@lib/hooks/useLocale";

import Select from "@components/ui/form/Select";

interface OptionTypeBase {
  label: string;
  value: EventTypeCustomInputType;
}

interface Props {
  onSubmit: SubmitHandler<IFormInput>;
  onCancel: () => void;
  selectedCustomInput?: EventTypeCustomInput;
}

type IFormInput = EventTypeCustomInput;

const CustomInputTypeForm: FC<Props> = (props) => {
  const { t } = useLocale();
  const inputOptions: OptionTypeBase[] = [
    { value: EventTypeCustomInputType.TEXT, label: t("text") },
    { value: EventTypeCustomInputType.TEXTLONG, label: t("multiline_text") },
    { value: EventTypeCustomInputType.NUMBER, label: t("number") },
    { value: EventTypeCustomInputType.BOOL, label: t("checkbox") },
  ];
  const { selectedCustomInput } = props;
  const defaultValues = selectedCustomInput || { type: inputOptions[0].value };
  const { register, control, handleSubmit } = useForm<IFormInput>({
    defaultValues,
  });
  const selectedInputType = useWatch({ name: "type", control });
  const selectedInputOption = inputOptions.find((e) => selectedInputType === e.value);

  const onCancel = () => {
    props.onCancel();
  };

  return (
    <form onSubmit={handleSubmit(props.onSubmit)}>
      <div className="mb-4">
        <label htmlFor="type" className="sellular-input-label block">
          {t("input_type")}
        </label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              id="type"
              defaultValue={selectedInputOption}
              options={inputOptions}
              isSearchable={false}
              className="mt-1 mb-2 block w-full min-w-0 flex-1  text-sm"
              onChange={(option) => option && field.onChange(option.value)}
              value={selectedInputOption}
              onBlur={field.onBlur}
              name={field.name}
            />
          )}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="label" className="sellular-input-label block">
          {t("label")}
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="label"
            required
            className="sellular-input--text block w-full"
            defaultValue={selectedCustomInput?.label}
            {...register("label", { required: true })}
          />
        </div>
      </div>
      {(selectedInputType === EventTypeCustomInputType.TEXT ||
        selectedInputType === EventTypeCustomInputType.TEXTLONG) && (
        <div className="mb-4">
          <label htmlFor="placeholder" className="sellular-input-label block">
            {t("placeholder")}
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="placeholder"
              className="sellular-input--text block w-full"
              defaultValue={selectedCustomInput?.placeholder}
              {...register("placeholder")}
            />
          </div>
        </div>
      )}
      <div className="flex h-5 items-center">
        <input
          id="required"
          type="checkbox"
          className="text-brand focus:ring-brand border-brand h-4 w-4 rounded ltr:mr-2 rtl:ml-2"
          defaultChecked={selectedCustomInput?.required ?? true}
          {...register("required")}
        />
        <label htmlFor="required" className="block text-sm font-medium text-gray-500">
          {t("is_required")}
        </label>
      </div>
      <input
        type="hidden"
        id="eventTypeId"
        value={selectedCustomInput?.eventTypeId || -1}
        {...register("eventTypeId", { valueAsNumber: true })}
      />
      <input
        type="hidden"
        id="id"
        value={selectedCustomInput?.id || -1}
        {...register("id", { valueAsNumber: true })}
      />
      <div className="mt-5 flex space-x-2 sm:mt-5">
        <Button onClick={onCancel} type="button" color="secondary" className="ltr:mr-2">
          {t("cancel")}
        </Button>
        <Button type="submit">{t("save")}</Button>
      </div>
    </form>
  );
};

export default CustomInputTypeForm;
