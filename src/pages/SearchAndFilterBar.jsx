import React from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function SearchAndFilterBar({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  accountTypeOptions,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
      <input
        type="text"
        className="w-full sm:w-64 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        placeholder="Search accounts..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="w-full sm:w-64">
        <Listbox value={typeFilter} onChange={setTypeFilter}>
          {({ open }) => (
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span className="block truncate">
                  {typeFilter || "All Account Types"}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                show={open}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60">
                  <Listbox.Option value="">
                    {({ selected }) => (
                      <span className={classNames(selected ? "font-medium text-blue-700" : "font-normal", "block truncate px-4 py-2")}>
                        Account Types
                      </span>
                    )}
                  </Listbox.Option>
                  {accountTypeOptions.map((type) => (
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
      </div>
    </div>
  );
}
