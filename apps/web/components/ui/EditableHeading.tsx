import { useState } from "react";

import { Icon } from "@calcom/ui/Icon";

const EditableHeading = ({
  title,
  onChange,
  placeholder = "",
  readOnly = false,
}: {
  title: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const enableEditing = () => !readOnly && setIsEditing(true);
  return (
    <div className="group relative cursor-pointer" onClick={enableEditing}>
      {!isEditing ? (
        <>
          <h1
            style={{ fontSize: 22, letterSpacing: "-0.0009em" }}
            className="inline pl-0 normal-case text-gray-900 focus:text-black">
            {title}
          </h1>
          {!readOnly ? <Icon.FiEdit2 className="ml-1 -mt-1 inline h-4 w-4 text-gray-700" /> : null}
        </>
      ) : (
        <input
          type="text"
          autoFocus
          style={{ fontSize: 22, height: "28px" }}
          required
          className="sellular-input-shadow relative cursor-pointer border-none bg-transparent p-0 text-gray-900"
          placeholder={placeholder}
          defaultValue={title}
          onBlur={(e) => {
            setIsEditing(false);
            onChange && onChange(e.target.value);
          }}
        />
      )}
    </div>
  );
};

export default EditableHeading;
