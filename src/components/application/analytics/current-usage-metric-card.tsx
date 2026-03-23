"use client";

import type { FC } from "react";
import { TrendUp01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx, sortCx } from "@/utils/cx";

const styles = sortCx({
    card: "flex h-full min-w-0 flex-col rounded-lg border-[1px] border-solid border-primary bg-primary shadow-xs",
    metricBody: "flex flex-col gap-3 p-4 sm:p-5",
    metricLabelRow: "flex items-center justify-between gap-3",
    metricCaption: "text-sm font-medium text-tertiary",
    metricTrendIcon: "size-4 shrink-0 text-fg-quaternary",
    metricValueRow: "flex min-w-0 flex-wrap items-baseline gap-x-1",
    metricFigure: "text-display-xs font-semibold text-primary sm:text-display-sm",
    metricValueSuffix: "text-md font-normal text-tertiary",
    cardFooter:
        "mt-auto flex justify-end border-t-[1px] border-solid border-primary px-[length:var(--primitive-spacing-xl)] py-[length:var(--primitive-spacing-lg)]",
});

export interface CurrentUsageMetricCardProps {
    /** Metric label (e.g. “Processed words”). */
    label: string;
    /** Displayed value (e.g. “2.4M”). */
    value: string;
    /** Optional quota or cap shown after the value in body text (e.g. “/3M”). */
    valueSuffix?: string;
    /** Optional icon beside the label; defaults to trend-up. */
    trendIcon?: FC<{ className?: string }>;
    /** Footer action label. */
    actionLabel?: string;
    className?: string;
}

export const CurrentUsageMetricCard = ({
    label,
    value,
    valueSuffix,
    trendIcon: TrendIcon = TrendUp01,
    actionLabel = "Upgrade",
    className,
}: CurrentUsageMetricCardProps) => {
    return (
        <div className={cx(styles.card, className)}>
            <div className={styles.metricBody}>
                <div className={styles.metricLabelRow}>
                    <p className={styles.metricCaption}>{label}</p>
                    <TrendIcon className={styles.metricTrendIcon} aria-hidden={true} />
                </div>
                <div className={styles.metricValueRow}>
                    <span className={styles.metricFigure}>{value}</span>
                    {valueSuffix ? <span className={styles.metricValueSuffix}>{valueSuffix}</span> : null}
                </div>
            </div>
            <div className={styles.cardFooter}>
                <Button color="secondary" size="sm">
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
};
