import React from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const UPDATE_TYPE_OPTIONS = [
  "Call",
  "Email",
  "Online Meeting",
  "Physical Meeting",
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function UpdateForm({
  notes,
  updateType,
  onNotesChange,
  onTypeChange,
  onSubmit,
  error,
}) {
  return (
    <form
      className="flex flex-col sm:flex-row gap-4 w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {/* Textarea */}
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        className="resize-none p-3 border border-gray-300 rounded-lg text-sm w-full min-h-[90px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white"
        placeholder="Enter your update here..."
        required
      ></textarea>

      {/* Right column with dropdown and button */}
      <div className="flex flex-col justify-between items-stretch gap-2 sm:w-[160px]">
        {/* Stylish Dropdown */}
        <Listbox value={updateType} onChange={onTypeChange}>
          {({ open }) => (
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span className="block truncate">{updateType}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                show={open}
                as="div"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60">
                  {UPDATE_TYPE_OPTIONS.map((type) => (
                    <Listbox.Option
                      key={type}
                      value={type}
                      className={({ active }) =>
                        classNames(
                          active ? "bg-blue-600 text-white" : "text-gray-900",
                          "cursor-default select-none relative py-2 pl-10 pr-4"
                        )
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={classNames(
                              selected ? "font-medium" : "font-normal",
                              "block truncate"
                            )}
                          >
                            {type}
                          </span>
                          {selected && (
                            <span
                              className={classNames(
                                active ? "text-white" : "text-blue-600",
                                "absolute inset-y-0 left-0 flex items-center pl-3"
                              )}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-gray-400 text-sm font-medium px-4 py-2 rounded-lg text-white hover:bg-gray-800 transition-all shadow-sm"
        >
          Save Update
        </button>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-xs mt-1 text-center">
            {error}
          </div>
        )}
      </div>
    </form>
  );
}