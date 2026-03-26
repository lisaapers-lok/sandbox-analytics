"use client";

import type { ComponentProps, MouseEvent } from "react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
    BarChartSquare02,
    CheckDone01,
    ChevronDown,
    ChevronRight,
    FilterFunnel01,
    Home01,
    LifeBuoy01,
    PieChart03,
    Rocket02,
    Rows01,
    SearchLg,
    Settings01,
    Share02,
    Users01,
} from "@untitledui/icons";
import type { Key, Selection } from "react-aria-components";
import { TabPanel as AriaTabPanel, TabPanels as AriaTabPanels } from "react-aria-components";
import { CurrentUsageMetricCard } from "@/components/application/analytics/current-usage-metric-card";
import { UsageTrendMetricPicker } from "@/components/application/analytics/usage-trend-metric-picker";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { NavItemButton } from "@/components/application/app-navigation/base-components/nav-item-button";
import { Table, TableCard } from "@/components/application/table/table";
import { Tabs } from "@/components/application/tabs/tabs";
import { Avatar } from "@/components/base/avatar/avatar";
import type { BadgeColors } from "@/components/base/badges/badge-types";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { ProgressBar, ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";

/** Full-width shell: horizontal inset scales with viewport; vertical + grid gaps stay even (Figma-style fill + spacing). */
const shellX = "px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12";
const stackGap = "flex flex-col gap-6 md:gap-8";
const gridGap = "gap-4 sm:gap-5 md:gap-6";

function preventPlaceholderNavClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
}

const filterItems = [
    { id: "all", label: "All Projects", supportingText: "@olivia" },
    { id: "mobile", label: "Mobile App", supportingText: "@olivia" },
];

const languageItems = [
    { id: "en-de", label: "EN → DE", supportingText: "@olivia" },
    { id: "en-fr", label: "EN → FR", supportingText: "@olivia" },
];

const dateItems = [
    { id: "30", label: "Last 30 Days", supportingText: "@olivia" },
    { id: "7", label: "Last 7 Days", supportingText: "@olivia" },
];

type UsageTrendMetricId = "processed" | "pro-ai" | "mcp" | "tasks";

type UsageTrendMetricConfig = {
    label: string;
    value: string;
    capLabel: string;
    progress: number;
    trend: string;
    trendColor: BadgeColors;
    /** Normalized chart samples (viewBox Y; lower = higher on screen). */
    seriesY: readonly number[];
    chartStroke: string;
    chartGradHigh: string;
    chartGradLow: string;
    /** Labels under the chart (one per tick). */
    chartXAxisLabels: readonly string[];
    /** Progress fill (matches chart accent). */
    progressFillClass: string;
};

const usageTrendMetrics: Record<UsageTrendMetricId, UsageTrendMetricConfig> = {
    processed: {
        label: "Processed words",
        value: "2.4M",
        capLabel: "/3M",
        progress: 80,
        trend: "+12.8%",
        trendColor: "success",
        seriesY: [148, 132, 124, 118, 102, 94, 88, 76, 82, 64, 70, 54, 58, 44, 40, 36],
        chartStroke: "var(--color-fg-brand-primary)",
        chartGradHigh: "var(--color-brand-400)",
        chartGradLow: "var(--color-brand-200)",
        chartXAxisLabels: ["May 1", "May 5", "May 12", "May 19", "May 23", "May 28", "May 30"],
        progressFillClass: "bg-fg-brand-primary",
    },
    "pro-ai": {
        label: "Pro AI words",
        value: "840k",
        capLabel: "/1M",
        progress: 84,
        trend: "+8.2%",
        trendColor: "success",
        seriesY: [100, 108, 98, 112, 104, 118, 108, 98, 88, 92, 84, 78, 72, 68, 62, 58],
        chartStroke: "var(--color-fg-brand-secondary)",
        chartGradHigh: "var(--color-brand-300)",
        chartGradLow: "var(--color-brand-100)",
        chartXAxisLabels: ["Apr 24", "May 1", "May 8", "May 15", "May 20", "May 26", "May 30"],
        progressFillClass: "bg-fg-brand-secondary",
    },
    mcp: {
        label: "MCP tokens",
        value: "1.2M",
        capLabel: "/1.5M",
        progress: 80,
        trend: "+5.1%",
        trendColor: "success",
        seriesY: [152, 150, 148, 145, 140, 135, 128, 120, 112, 105, 100, 96, 92, 88, 85, 82],
        chartStroke: "var(--color-indigo-600)",
        chartGradHigh: "var(--color-indigo-400)",
        chartGradLow: "var(--color-indigo-200)",
        chartXAxisLabels: ["Apr 30", "May 4", "May 11", "May 18", "May 22", "May 27", "May 30"],
        progressFillClass: "bg-indigo-600",
    },
    tasks: {
        label: "Tasks completed",
        value: "1,420",
        capLabel: "Total",
        progress: 71,
        trend: "+4.2%",
        trendColor: "success",
        seriesY: [152, 148, 88, 92, 138, 132, 78, 82, 124, 118, 70, 74, 108, 102, 62, 58],
        chartStroke: "var(--color-fg-success-secondary)",
        chartGradHigh: "var(--color-success-400)",
        chartGradLow: "var(--color-success-200)",
        chartXAxisLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        progressFillClass: "bg-fg-success-secondary",
    },
};

const metricSelectItems = (Object.keys(usageTrendMetrics) as UsageTrendMetricId[]).map((id) => ({
    id,
    label: usageTrendMetrics[id].label,
}));

function isUsageTrendMetricId(id: string): id is UsageTrendMetricId {
    return id in usageTrendMetrics;
}

function getUsageTrendMetricConfig(id: string): UsageTrendMetricConfig {
    return isUsageTrendMetricId(id) ? usageTrendMetrics[id] : usageTrendMetrics.processed;
}

type ExtraDashboardMetricId = "tm-savings" | "glossary-matches" | "avg-latency";

type DashboardMetricId = UsageTrendMetricId | ExtraDashboardMetricId;

const DASHBOARD_METRIC_CATALOG: Record<DashboardMetricId, { label: string; description: string; value: string; valueSuffix?: string }> = {
    processed: {
        label: "Processed words",
        description: "Total volume processed this billing period.",
        value: "2.4M",
        valueSuffix: "/3M",
    },
    "pro-ai": {
        label: "Pro AI words",
        description: "Words generated by Pro AI features.",
        value: "840k",
        valueSuffix: "/1M",
    },
    mcp: {
        label: "MCP tokens",
        description: "Tokens consumed by MCP integrations.",
        value: "1.2M",
        valueSuffix: "/1.5M",
    },
    tasks: {
        label: "Tasks completed",
        description: "Tasks finished in this billing cycle.",
        value: "1,420",
    },
    "tm-savings": {
        label: "TM savings",
        description: "Share of volume matched from translation memory.",
        value: "18%",
    },
    "glossary-matches": {
        label: "Glossary matches",
        description: "Terms resolved using your glossary.",
        value: "42k",
    },
    "avg-latency": {
        label: "Avg. API latency",
        description: "Mean response time for API requests.",
        value: "120ms",
    },
};

const DASHBOARD_METRIC_ORDER: DashboardMetricId[] = [
    "processed",
    "pro-ai",
    "mcp",
    "tasks",
    "tm-savings",
    "glossary-matches",
    "avg-latency",
];

const DEFAULT_VISIBLE_DASHBOARD_METRICS: ReadonlySet<DashboardMetricId> = new Set<DashboardMetricId>([
    "processed",
    "pro-ai",
    "mcp",
    "tasks",
]);

function buildUsageTrendPaths(ys: readonly number[]) {
    const w = 1000;
    const h = 180;
    const padY = 24;
    const innerH = h - padY;
    const n = ys.length;
    const step = w / (n - 1);
    const pts = ys.map((y, i) => ({ x: i * step, y }));
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L ${w} ${innerH} L 0 ${innerH} Z`;
    return { linePath: line, areaPath: area };
}

const tabItems: { id: string; children: string }[] = [
    { id: "usage", children: "Usage trends" },
    { id: "burn", children: "Burn rate & Projections" },
    { id: "savings", children: "AI Savings" },
];

type Column = { id: string; name: string };

const tableColumns: Column[] = [
    { id: "project", name: "Project" },
    { id: "processedWords", name: "Processed words" },
    { id: "proAi", name: "Pro AI" },
    { id: "mcpTokens", name: "MCP tokens" },
    { id: "total", name: "Total usage" },
    { id: "savings", name: "Savings" },
    { id: "spent", name: "Spent" },
    { id: "quota", name: "Quota used" },
    { id: "status", name: "Status" },
];

type RowStatus = "on-track" | "at-risk" | "exceeded";

type DataRow = {
    id: string;
    project: string;
    processedWords: string;
    proAi: string;
    mcpTokens: string;
    total: string;
    savings: string;
    spent: string;
    quota: number;
    status: RowStatus;
};

/** Fixed widths for volume metric columns (headers use nowrap in Table.Head). */
function tableMetricVolumeColumnClass(columnId: string): string | undefined {
    switch (columnId) {
        case "processedWords":
            return "w-[10.5rem] min-w-[10.5rem] max-w-[10.5rem]";
        case "proAi":
            return "w-[6.25rem] min-w-[6.25rem] max-w-[6.25rem]";
        case "mcpTokens":
            return "w-[8rem] min-w-[8rem] max-w-[8rem]";
        default:
            return undefined;
    }
}

const tableRows: DataRow[] = [
    {
        id: "1",
        project: "Mobile App - iOS",
        processedWords: "812k",
        proAi: "420k",
        mcpTokens: "192k",
        total: "1.2M",
        savings: "$1,120",
        spent: "$3,240",
        quota: 62,
        status: "on-track",
    },
    {
        id: "2",
        project: "Website Localization",
        processedWords: "512k",
        proAi: "280k",
        mcpTokens: "48k",
        total: "840k",
        savings: "$980",
        spent: "$2,180",
        quota: 45,
        status: "on-track",
    },
    {
        id: "3",
        project: "Marketing Website",
        processedWords: "1.42M",
        proAi: "600k",
        mcpTokens: "80k",
        total: "2.1M",
        savings: "$1,540",
        spent: "$4,890",
        quota: 88,
        status: "at-risk",
    },
    {
        id: "4",
        project: "Help Center",
        processedWords: "198k",
        proAi: "90k",
        mcpTokens: "22k",
        total: "310k",
        savings: "$320",
        spent: "$890",
        quota: 18,
        status: "on-track",
    },
    {
        id: "5",
        project: "Internal Docs",
        processedWords: "1.08M",
        proAi: "750k",
        mcpTokens: "62k",
        total: "1.9M",
        savings: "$1,680",
        spent: "$5,120",
        quota: 96,
        status: "exceeded",
    },
];

function QuotaBar({ percent }: { percent: number }) {
    const clamped = Math.min(100, Math.max(0, percent));
    return (
        <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs text-tertiary">{clamped}%</span>
            <ProgressBarBase value={clamped} className="rounded-full" progressClassName="rounded-full" />
        </div>
    );
}

function StatusBadge({ status }: { status: RowStatus }) {
    if (status === "on-track") {
        return (
            <Badge color="success" size="sm" type="pill-color">
                On Track
            </Badge>
        );
    }
    if (status === "at-risk") {
        return (
            <Badge color="orange" size="sm" type="pill-color">
                At Risk
            </Badge>
        );
    }
    return (
        <Badge color="error" size="sm" type="pill-color">
            Limit Exceeded
        </Badge>
    );
}

/** Stable DOM ids — avoids SSR/client mismatches from `useId()` inside the chart SVG. */
const USAGE_TREND_CHART_GRAD_ID = "analytics-usage-trend-chart-grad";
const USAGE_TREND_CHART_TITLE_ID = "analytics-usage-trend-chart-title";

function UsageTrendChart({ metricId, metricLabel }: { metricId: string; metricLabel: string }) {
    const gradientId = USAGE_TREND_CHART_GRAD_ID;
    const chartTitleId = USAGE_TREND_CHART_TITLE_ID;
    const chart = getUsageTrendMetricConfig(metricId);
    const { linePath, areaPath } = useMemo(() => buildUsageTrendPaths(getUsageTrendMetricConfig(metricId).seriesY), [metricId]);

    return (
        <svg className="h-44 w-full sm:h-56 md:h-60" viewBox="0 0 1000 180" preserveAspectRatio="none" role="img" aria-labelledby={chartTitleId}>
            <title id={chartTitleId}>{`${metricLabel} usage trend over the last 30 days`}</title>
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.chartGradHigh} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={chart.chartGradLow} stopOpacity={0.06} />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path
                d={linePath}
                fill="none"
                stroke={chart.chartStroke}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

export const AnalyticsScreen = () => {
    const [project, setProject] = useState("all");
    const [language, setLanguage] = useState("en-de");
    const [dateRange, setDateRange] = useState("30");
    const [metric, setMetric] = useState<UsageTrendMetricId>("processed");
    const [allDataToolbarKeys, setAllDataToolbarKeys] = useState<Selection>(() => new Set<Key>());
    const [dashboardMetricsModalOpen, setDashboardMetricsModalOpen] = useState(false);
    const [visibleDashboardMetricIds, setVisibleDashboardMetricIds] = useState<Set<DashboardMetricId>>(
        () => new Set(DEFAULT_VISIBLE_DASHBOARD_METRICS),
    );
    const [modalDashboardMetricIds, setModalDashboardMetricIds] = useState<Set<DashboardMetricId>>(
        () => new Set(DEFAULT_VISIBLE_DASHBOARD_METRICS),
    );

    useEffect(() => {
        if (!dashboardMetricsModalOpen) return;
        setModalDashboardMetricIds(new Set(visibleDashboardMetricIds));
    }, [dashboardMetricsModalOpen, visibleDashboardMetricIds]);

    const toggleModalDashboardMetric = (id: DashboardMetricId, selected: boolean) => {
        setModalDashboardMetricIds((prev) => {
            const next = new Set(prev);
            if (selected) {
                next.add(id);
            } else {
                if (next.size <= 1 && next.has(id)) return prev;
                next.delete(id);
            }
            return next;
        });
    };

    const usageMetric = getUsageTrendMetricConfig(metric);

    return (
        <div className="flex h-dvh min-h-0 bg-primary text-primary">
            <aside className="flex w-[68px] shrink-0 flex-col py-1 pl-1">
                <div className="flex h-full min-h-0 flex-col justify-between rounded-lg border-[1px] border-solid border-secondary bg-primary pt-5 shadow-xs">
                    <div className="flex flex-col items-center gap-4 px-3">
                        <Image
                            src="/icon.png"
                            alt=""
                            width={32}
                            height={32}
                            className="size-8 shrink-0 object-contain"
                            priority
                        />
                        <ul className="flex w-full flex-col gap-0.5">
                            <li>
                                <NavItemButton href="/" label="Home" icon={Home01} />
                            </li>
                            <li>
                                <NavItemButton current label="Analytics" href="/" icon={BarChartSquare02} />
                            </li>
                            <li>
                                <NavItemButton href="#" label="Projects" icon={Rows01} onClick={preventPlaceholderNavClick} />
                            </li>
                            <li>
                                <NavItemButton href="#" label="Tasks" icon={CheckDone01} onClick={preventPlaceholderNavClick} />
                            </li>
                            <li>
                                <NavItemButton href="#" label="Reports" icon={PieChart03} onClick={preventPlaceholderNavClick} />
                            </li>
                            <li>
                                <NavItemButton href="#" label="Team" icon={Users01} onClick={preventPlaceholderNavClick} />
                            </li>
                        </ul>
                    </div>
                    <div className="flex flex-col items-center gap-4 px-3 pb-5">
                        <ul className="flex flex-col gap-0.5">
                            <li>
                                <NavItemButton href="#" label="Support" icon={LifeBuoy01} onClick={preventPlaceholderNavClick} />
                            </li>
                            <li>
                                <NavItemButton href="#" label="Settings" icon={Settings01} onClick={preventPlaceholderNavClick} />
                            </li>
                        </ul>
                        <Avatar src="https://i.pravatar.cc/150?u=olivia" alt="Olivia Rhye" size="md" status="online" />
                    </div>
                </div>
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <header className="shrink-0 border-b-[1px] border-solid border-primary">
                    <div className={cx("w-full min-w-0 pt-3 pb-5 sm:pt-4 sm:pb-6 md:pb-8", shellX)}>
                        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
                            <Button href="/" color="link-gray" size="sm" iconLeading={Home01} aria-label="Home" className="size-9 min-w-9 shrink-0" />
                            <ChevronRight className="size-4 shrink-0 text-fg-quaternary" aria-hidden />
                            <span className="rounded-lg bg-primary_hover px-2 py-1 font-semibold text-secondary">Analytics</span>
                        </nav>
                        <div className="mt-4 flex min-w-0 flex-col gap-4 sm:mt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 md:gap-8">
                            <div className="min-w-0 flex-1 space-y-1">
                                <h1 className="text-display-xs font-semibold text-primary">Analytics</h1>
                                <p className="text-md text-tertiary">Track your translation performance and AI consumption</p>
                            </div>
                            <div className="flex w-full min-w-0 items-center gap-2 sm:w-[calc((100%-var(--primitive-spacing-lg))/2)] sm:gap-3 lg:w-[calc((100%-3*var(--primitive-spacing-lg))/4)]">
                                <Button
                                    type="button"
                                    color="secondary"
                                    size="md"
                                    iconLeading={Settings01}
                                    aria-label="Settings"
                                    className="shrink-0"
                                    onClick={() => setDashboardMetricsModalOpen(true)}
                                />
                                <Input icon={SearchLg} placeholder="Search" shortcut="⌘K" aria-label="Search" size="md" className="min-w-0 flex-1" />
                                <Dropdown.Root>
                                    <Button color="secondary" size="md" iconLeading={Share02} iconTrailing={ChevronDown} className="shrink-0 whitespace-nowrap">
                                        Export
                                    </Button>
                                    <Dropdown.Popover className="w-48">
                                        <Dropdown.Menu>
                                            <Dropdown.Item id="export-pdf" label="PDF" />
                                            <Dropdown.Item id="export-csv" label="CSV" />
                                        </Dropdown.Menu>
                                    </Dropdown.Popover>
                                </Dropdown.Root>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                    <div className={cx("w-full min-w-0 py-5 sm:py-6 md:py-8", shellX, stackGap)}>
                        <section className="rounded-lg bg-secondary p-4 sm:p-5 md:p-6">
                            <div className={cx("grid min-w-0 grid-cols-1 md:grid-cols-3", gridGap)}>
                                <Select
                                    label="Project"
                                    tooltip="Scope metrics to a project"
                                    isRequired
                                    items={filterItems}
                                    selectedKey={project}
                                    onSelectionChange={(key: Key | null) => key != null && setProject(String(key))}
                                    className="w-full min-w-0"
                                    size="md"
                                >
                                    {(item) => (
                                        <Select.Item id={item.id} supportingText={item.supportingText}>
                                            {item.label}
                                        </Select.Item>
                                    )}
                                </Select>
                                <Select
                                    label="Language Pair"
                                    tooltip="Source and target language"
                                    isRequired
                                    items={languageItems}
                                    selectedKey={language}
                                    onSelectionChange={(key: Key | null) => key != null && setLanguage(String(key))}
                                    className="w-full min-w-0"
                                    size="md"
                                >
                                    {(item) => (
                                        <Select.Item id={item.id} supportingText={item.supportingText}>
                                            {item.label}
                                        </Select.Item>
                                    )}
                                </Select>
                                <Select
                                    label="Date Range"
                                    tooltip="Reporting period"
                                    isRequired
                                    items={dateItems}
                                    selectedKey={dateRange}
                                    onSelectionChange={(key: Key | null) => key != null && setDateRange(String(key))}
                                    className="w-full min-w-0"
                                    size="md"
                                >
                                    {(item) => (
                                        <Select.Item id={item.id} supportingText={item.supportingText}>
                                            {item.label}
                                        </Select.Item>
                                    )}
                                </Select>
                            </div>
                        </section>

                        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 md:gap-6">
                            <section className={cx(stackGap, "mb-[length:var(--primitive-spacing-md)]")}>
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold text-primary">Current usage</h2>
                                    <p className="text-xs text-tertiary">Usage resets in 12 days</p>
                                </div>
                                <div className="grid min-w-0 grid-cols-1 gap-[length:var(--primitive-spacing-lg)] sm:grid-cols-2 lg:grid-cols-4">
                                    {DASHBOARD_METRIC_ORDER.filter((id) => visibleDashboardMetricIds.has(id)).map((id) => {
                                        const row = DASHBOARD_METRIC_CATALOG[id];
                                        return (
                                            <CurrentUsageMetricCard
                                                key={id}
                                                label={row.label}
                                                value={row.value}
                                                valueSuffix={row.valueSuffix}
                                            />
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="flex flex-col gap-2 sm:gap-2.5 md:gap-3">
                                <h2 className="text-lg font-semibold text-primary">Usage trends and projections</h2>
                                <Tabs defaultSelectedKey="usage" className="gap-4 md:gap-6">
                                    <Tabs.List
                                        type="button-brand"
                                        size="sm"
                                        items={tabItems}
                                        className="scrollbar-hide w-full min-w-0 gap-2 overflow-x-auto pb-1 sm:gap-3"
                                    >
                                        {(item: ComponentProps<typeof Tabs.Item>) => <Tabs.Item {...item} id={item.id} />}
                                    </Tabs.List>
                                    <AriaTabPanels items={tabItems} className="flex min-w-0 flex-col gap-4 md:gap-6">
                                        {(item: (typeof tabItems)[number]) => (
                                            <AriaTabPanel
                                                // Collection item `id` links panel to tab; RAC types omit `id` on TabPanel in some versions.
                                                {...{ id: item.id }}
                                                className={cx(
                                                    "outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2",
                                                    item.id !== "usage" &&
                                                        "rounded-lg border-[1px] border-solid border-secondary bg-secondary p-6 text-center text-md text-tertiary sm:p-8 md:p-10",
                                                )}
                                            >
                                                {item.id === "usage" && (
                                                    <div className="grid min-w-0 grid-cols-1 items-stretch gap-[length:var(--primitive-spacing-lg)] lg:grid-cols-12">
                                                        <div className="min-w-0 lg:col-span-4 xl:col-span-3">
                                                            <div className="flex h-full min-h-0 flex-col justify-between gap-6 rounded-lg border-[1px] border-solid border-primary bg-primary p-4 shadow-xs sm:p-5 md:p-6">
                                                                <div className="space-y-4">
                                                                    <UsageTrendMetricPicker
                                                                        aria-label="Metric"
                                                                        items={metricSelectItems}
                                                                        selectedKey={metric}
                                                                        onSelectionChange={(id) => {
                                                                            if (isUsageTrendMetricId(id)) setMetric(id);
                                                                        }}
                                                                        className="w-full"
                                                                    />
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-baseline justify-between gap-2">
                                                                            <span className="text-lg font-semibold text-primary">{usageMetric.value}</span>
                                                                            <span className="text-sm text-tertiary">{usageMetric.capLabel}</span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className="text-sm text-tertiary">Trend</span>
                                                                            <Badge color={usageMetric.trendColor} size="sm" type="pill-color">
                                                                                {usageMetric.trend}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    <ProgressBar
                                                                        value={usageMetric.progress}
                                                                        labelPosition="bottom"
                                                                        className="rounded-full"
                                                                        progressClassName={cx("rounded-full", usageMetric.progressFillClass)}
                                                                    />
                                                                </div>
                                                                <Button color="secondary" size="md" className="w-full justify-center" iconTrailing={Rocket02}>
                                                                    Upgrade plan
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0 lg:col-span-8 xl:col-span-9">
                                                            <div className="flex h-full min-h-0 flex-col rounded-lg border-[1px] border-solid border-primary bg-primary p-4 shadow-xs sm:p-5 md:p-6">
                                                                <div className="relative w-full min-w-0 flex-1 overflow-hidden">
                                                                    <UsageTrendChart key={metric} metricId={metric} metricLabel={usageMetric.label} />
                                                                    <div className="mt-3 flex w-full min-w-0 justify-between gap-1 text-center text-xs text-tertiary sm:mt-4 sm:gap-2">
                                                                        {usageMetric.chartXAxisLabels.map((d, i) => (
                                                                            <span key={`${metric}-x-${i}`} className="min-w-0 flex-1 truncate">
                                                                                {d}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {item.id === "burn" && "Burn rate and projections will appear here."}
                                                {item.id === "savings" && "AI savings will appear here."}
                                            </AriaTabPanel>
                                        )}
                                    </AriaTabPanels>
                                </Tabs>
                            </section>

                            <section className={cx("pb-6 sm:pb-8 md:pb-10")}>
                                <TableCard.Root size="md" className="w-full min-w-0 rounded-lg border-[1px] border-solid border-primary shadow-xs ring-0">
                                    <TableCard.Header
                                        title="All data"
                                        className="md:items-center"
                                        contentTrailing={
                                            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
                                                <ButtonGroup
                                                    size="md"
                                                    selectionMode="multiple"
                                                    selectedKeys={allDataToolbarKeys}
                                                    onSelectionChange={() => setAllDataToolbarKeys(new Set())}
                                                >
                                                    <ButtonGroupItem id="filter" aria-label="Filter" iconLeading={FilterFunnel01} />
                                                </ButtonGroup>
                                            </div>
                                        }
                                    />
                                    <Table aria-label="Project usage data" size="md" className="table-fixed">
                                        <Table.Header columns={tableColumns}>
                                            {(col) => (
                                                <Table.Head
                                                    id={col.id}
                                                    label={col.name}
                                                    isRowHeader={col.id === "project"}
                                                    className={cx(
                                                        tableMetricVolumeColumnClass(col.id),
                                                        (col.id === "processedWords" || col.id === "proAi" || col.id === "mcpTokens") &&
                                                            "text-right [&>div]:w-full [&>div]:justify-end",
                                                        col.id === "project" && "w-[14rem] min-w-0 max-w-[16rem]",
                                                    )}
                                                />
                                            )}
                                        </Table.Header>
                                        <Table.Body items={tableRows}>
                                            {(row: DataRow) => (
                                                <Table.Row id={row.id} columns={tableColumns}>
                                                    {(column) => (
                                                        <Table.Cell
                                                            className={cx(
                                                                tableMetricVolumeColumnClass(column.id),
                                                                column.id === "project" && "min-w-0 max-w-[16rem] truncate font-medium text-primary",
                                                                (
                                                                    column.id === "processedWords" ||
                                                                    column.id === "proAi" ||
                                                                    column.id === "mcpTokens" ||
                                                                    column.id === "total" ||
                                                                    column.id === "savings" ||
                                                                    column.id === "spent"
                                                                ) &&
                                                                    "font-medium text-primary",
                                                                (column.id === "processedWords" ||
                                                                    column.id === "proAi" ||
                                                                    column.id === "mcpTokens") &&
                                                                    "text-right tabular-nums",
                                                            )}
                                                        >
                                                            {column.id === "project" && row.project}
                                                            {column.id === "processedWords" && row.processedWords}
                                                            {column.id === "proAi" && row.proAi}
                                                            {column.id === "mcpTokens" && row.mcpTokens}
                                                            {column.id === "total" && row.total}
                                                            {column.id === "savings" && row.savings}
                                                            {column.id === "spent" && row.spent}
                                                            {column.id === "quota" && <QuotaBar percent={row.quota} />}
                                                            {column.id === "status" && <StatusBadge status={row.status} />}
                                                        </Table.Cell>
                                                    )}
                                                </Table.Row>
                                            )}
                                        </Table.Body>
                                    </Table>
                                </TableCard.Root>
                            </section>
                        </div>
                    </div>
                </main>
            </div>

            <ModalOverlay
                isOpen={dashboardMetricsModalOpen}
                onOpenChange={setDashboardMetricsModalOpen}
                isDismissable
                className="items-center justify-center px-4 py-[clamp(16px,6vh,48px)] sm:px-8 sm:py-8"
            >
                <Modal className="flex w-full max-w-2xl justify-center">
                    <Dialog
                        aria-labelledby="dashboard-metrics-dialog-title"
                        className="w-full max-w-2xl min-w-0 p-0 outline-hidden sm:p-0"
                    >
                        <div className="flex max-h-[min(85dvh,40rem)] w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary_alt">
                            <div className="border-b-[1px] border-solid border-secondary px-5 py-5 sm:px-6">
                                <h2 id="dashboard-metrics-dialog-title" className="text-lg font-semibold text-primary">
                                    Dashboard metrics
                                </h2>
                                <p className="mt-1 text-sm text-tertiary">Choose which metrics appear in Current usage. At least one must stay on.</p>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                                <ul className="flex flex-col gap-4">
                                    {DASHBOARD_METRIC_ORDER.map((id) => {
                                        const row = DASHBOARD_METRIC_CATALOG[id];
                                        const isOnlySelected = modalDashboardMetricIds.size === 1 && modalDashboardMetricIds.has(id);
                                        return (
                                            <li key={id}>
                                                <Checkbox
                                                    size="md"
                                                    isSelected={modalDashboardMetricIds.has(id)}
                                                    isDisabled={isOnlySelected}
                                                    onChange={(selected) => toggleModalDashboardMetric(id, selected)}
                                                    label={row.label}
                                                    hint={row.description}
                                                />
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            <div className="flex flex-col-reverse gap-3 border-t-[1px] border-solid border-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                                <Button
                                    type="button"
                                    color="secondary"
                                    size="md"
                                    className="w-full sm:w-auto"
                                    onClick={() => setDashboardMetricsModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    color="primary"
                                    size="md"
                                    className="w-full sm:w-auto"
                                    onClick={() => {
                                        setVisibleDashboardMetricIds(new Set(modalDashboardMetricIds));
                                        setDashboardMetricsModalOpen(false);
                                    }}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
};
