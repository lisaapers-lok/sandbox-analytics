"use client";

import { Check, ChevronDown } from "@untitledui/icons";
import { useContext } from "react";
import type { Key, Selection } from "react-aria-components";
import {
    Button as AriaButton,
    Menu as AriaMenu,
    MenuItem as AriaMenuItem,
    MenuTrigger as AriaMenuTrigger,
    OverlayTriggerStateContext,
    Text as AriaText,
} from "react-aria-components";
import { Popover } from "@/components/base/select/popover";
import { cx } from "@/utils/cx";

export type UsageTrendMetricPickerItem = { id: string; label: string };

type UsageTrendMetricPickerProps = {
    "aria-label": string;
    items: UsageTrendMetricPickerItem[];
    selectedKey: string;
    onSelectionChange: (id: string) => void;
    className?: string;
};

function MetricPickerTrigger({ ariaLabel, currentLabel }: { ariaLabel: string; currentLabel: string }) {
    const overlayState = useContext(OverlayTriggerStateContext);
    const isOpen = overlayState?.isOpen ?? false;

    return (
        <AriaButton
            aria-label={ariaLabel}
            className={(btn) =>
                cx(
                    "relative flex w-full cursor-pointer items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary outline-hidden transition duration-100 ease-linear ring-inset",
                    (btn.isFocusVisible || isOpen) && "ring-2 ring-brand",
                    "py-2.5 px-3.5",
                )
            }
        >
            <span className="flex h-max w-full items-center justify-start gap-2 truncate text-left align-middle *:data-icon:size-5 *:data-icon:shrink-0 *:data-icon:text-fg-quaternary">
                <section className="flex w-full gap-2 truncate">
                    <p className="truncate text-md font-medium text-primary">{currentLabel}</p>
                </section>
                <ChevronDown aria-hidden className="ml-auto size-5 shrink-0 text-fg-quaternary" />
            </span>
        </AriaButton>
    );
}

function MetricPickerMenuItem({
    item,
    onSelect,
}: {
    item: UsageTrendMetricPickerItem;
    onSelect: (id: string) => void;
}) {
    return (
        <AriaMenuItem
            id={item.id}
            textValue={item.label}
            className={(state) => cx("w-full px-1.5 py-px outline-hidden")}
            onAction={() => onSelect(item.id)}
        >
            {(state) => (
                <div
                    className={cx(
                        "flex cursor-pointer items-center gap-2 rounded-md outline-hidden select-none",
                        state.isSelected && "bg-active",
                        state.isDisabled && "cursor-not-allowed",
                        state.isFocused && "bg-primary_hover",
                        state.isFocusVisible && "ring-2 ring-focus-ring ring-inset",
                        "*:data-icon:size-5 *:data-icon:shrink-0 *:data-icon:text-fg-quaternary",
                        state.isDisabled && "*:data-icon:text-fg-disabled",
                        "p-2.5 pl-2",
                    )}
                >
                    <div className="flex min-w-0 flex-1 flex-wrap gap-x-2">
                        <AriaText
                            slot="label"
                            className={cx("truncate text-md font-medium whitespace-nowrap text-primary", state.isDisabled && "text-disabled")}
                        >
                            {item.label}
                        </AriaText>
                    </div>
                    {state.isSelected && (
                        <Check
                            aria-hidden
                            className={cx("ml-auto size-5 shrink-0 text-fg-brand-primary", state.isDisabled && "text-fg-disabled")}
                        />
                    )}
                </div>
            )}
        </AriaMenuItem>
    );
}

export function UsageTrendMetricPicker({
    "aria-label": ariaLabel,
    items,
    selectedKey,
    onSelectionChange,
    className,
}: UsageTrendMetricPickerProps) {
    const currentLabel = items.find((i) => i.id === selectedKey)?.label ?? "";

    return (
        <div className={cx("flex w-full flex-col gap-1.5", className)}>
            <AriaMenuTrigger>
                <MetricPickerTrigger ariaLabel={ariaLabel} currentLabel={currentLabel} />
                <Popover
                    size="md"
                    placement="bottom start"
                    offset={4}
                    className="z-50 min-w-[var(--trigger-width,12rem)]"
                    style={{
                        width: "var(--trigger-width, min(100%, 20rem))",
                        minWidth: "var(--trigger-width, min(100%, 20rem))",
                    }}
                >
                    <AriaMenu
                        disallowEmptySelection
                        selectionMode="single"
                        items={items}
                        selectedKeys={new Set<Key>([selectedKey])}
                        onSelectionChange={(keys: Selection) => {
                            if (keys === "all") return;
                            const key = keys.values().next().value;
                            if (key != null) onSelectionChange(String(key));
                        }}
                        className={() => cx("size-full outline-hidden select-none")}
                    >
                        {(item: UsageTrendMetricPickerItem) => (
                            <MetricPickerMenuItem key={item.id} item={item} onSelect={onSelectionChange} />
                        )}
                    </AriaMenu>
                </Popover>
            </AriaMenuTrigger>
        </div>
    );
}
