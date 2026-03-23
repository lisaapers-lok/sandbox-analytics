"use client";

import type { ComponentProps, MouseEvent } from "react";
import { useId, useMemo, useState } from "react";
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
    TrendUp01,
    Users01,
} from "@untitledui/icons";
import type { Key } from "react-aria-components";
import { TabPanel as AriaTabPanel, TabPanels as AriaTabPanels } from "react-aria-components";
import { NavItemButton } from "@/components/application/app-navigation/base-components/nav-item-button";
import { Table, TableCard } from "@/components/application/table/table";
import { Tabs } from "@/components/application/tabs/tabs";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { ProgressBar, ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { Select } from "@/components/base/select/select";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
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

const metricSelectItems = [{ id: "processed", label: "Processed Words" }];

const tabItems: { id: string; children: string }[] = [
    { id: "usage", children: "Usage trends" },
    { id: "burn", children: "Burn rate & Projections" },
    { id: "savings", children: "AI Savings" },
];

type Column = { id: string; name: string };

const tableColumns: Column[] = [
    { id: "project", name: "Project" },
    { id: "total", name: "Total usage" },
    { id: "proAi", name: "Pro AI words" },
    { id: "savings", name: "Savings" },
    { id: "quota", name: "Quota used" },
    { id: "status", name: "Status" },
];

type RowStatus = "on-track" | "at-risk" | "exceeded";

type DataRow = {
    id: string;
    project: string;
    total: string;
    proAi: string;
    savings: string;
    quota: number;
    status: RowStatus;
};

const tableRows: DataRow[] = [
    { id: "1", project: "Mobile App - iOS", total: "1.2M", proAi: "420k", savings: "$1,120", quota: 62, status: "on-track" },
    { id: "2", project: "Website Localization", total: "840k", proAi: "280k", savings: "$980", quota: 45, status: "on-track" },
    { id: "3", project: "Marketing Website", total: "2.1M", proAi: "600k", savings: "$1,540", quota: 88, status: "at-risk" },
    { id: "4", project: "Help Center", total: "310k", proAi: "90k", savings: "$320", quota: 18, status: "on-track" },
    { id: "5", project: "Internal Docs", total: "1.9M", proAi: "750k", savings: "$1,680", quota: 96, status: "exceeded" },
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
            <Badge color="brand" size="sm" type="pill-color">
                On Track
            </Badge>
        );
    }
    if (status === "at-risk") {
        return (
            <Badge color="gray" size="sm" type="pill-color">
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

function UsageTrendChart() {
    const rawId = useId().replace(/:/g, "");
    const gradientId = rawId ? `usage-chart-grad-${rawId}` : "usage-chart-grad";
    const chartTitleId = rawId ? `usage-chart-title-${rawId}` : "usage-chart-title";
    const { linePath, areaPath } = useMemo(() => {
        const w = 1000;
        const h = 180;
        const padY = 24;
        const innerH = h - padY;
        const ys = [142, 128, 118, 125, 108, 98, 102, 88, 92, 78, 82, 68, 72, 58, 52, 48];
        const n = ys.length;
        const step = w / (n - 1);
        const pts = ys.map((y, i) => ({ x: i * step, y }));
        const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
        const area = `${line} L ${w} ${innerH} L 0 ${innerH} Z`;
        return { linePath: line, areaPath: area };
    }, []);

    return (
        <svg className="h-44 w-full sm:h-56 md:h-60" viewBox="0 0 1000 180" preserveAspectRatio="none" role="img" aria-labelledby={chartTitleId}>
            <title id={chartTitleId}>Processed words usage trend over the last 30 days</title>
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand-400)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-brand-200)" stopOpacity={0.06} />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path
                d={linePath}
                fill="none"
                stroke="var(--color-fg-brand-primary)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex h-full min-w-0 flex-col rounded-lg border-[1px] border-solid border-primary bg-primary shadow-xs">
            <div className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-tertiary">{label}</p>
                    <TrendUp01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden />
                </div>
                <p className="text-display-xs font-semibold text-primary sm:text-display-sm">{value}</p>
            </div>
            <div className="mt-auto flex justify-end border-t-[1px] border-solid border-primary p-4 pt-3 sm:p-5 sm:pt-4">
                <Button color="secondary" size="sm">
                    Upgrade
                </Button>
            </div>
        </div>
    );
}

export const AnalyticsScreen = () => {
    const [project, setProject] = useState("all");
    const [language, setLanguage] = useState("en-de");
    const [dateRange, setDateRange] = useState("30");
    const [metric, setMetric] = useState("processed");

    return (
        <div className="flex h-dvh min-h-0 bg-primary text-primary">
            <aside className="flex w-[68px] shrink-0 flex-col py-1 pl-1">
                <div className="flex h-full min-h-0 flex-col justify-between rounded-xl border-[1px] border-solid border-secondary bg-primary pt-5 shadow-xs">
                    <div className="flex flex-col items-center gap-4 px-3">
                        <UntitledLogoMinimal className="size-8" />
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
                            <span className="rounded-md bg-primary_hover px-2 py-1 font-semibold text-secondary">Analytics</span>
                        </nav>
                        <div className="mt-4 flex min-w-0 flex-col gap-4 sm:mt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 md:gap-8">
                            <div className="min-w-0 flex-1 space-y-1">
                                <h1 className="text-display-xs font-semibold text-primary">Analytics</h1>
                                <p className="text-md text-tertiary">Track your translation performance and AI consumption</p>
                            </div>
                            <div className="w-full min-w-0 sm:max-w-md sm:flex-1 md:max-w-lg lg:max-w-xl">
                                <Input icon={SearchLg} placeholder="Search" shortcut="⌘K" aria-label="Search" size="md" className="w-full" />
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

                        <section className={cx(stackGap)}>
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-primary">Current usage</h2>
                                <p className="text-xs text-tertiary">Usage resets in 12 days</p>
                            </div>
                            <div className={cx("grid min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", gridGap)}>
                                <MetricCard label="Processed words" value="2.4M" />
                                <MetricCard label="Pro AI words" value="840k" />
                                <MetricCard label="MCP tokens" value="1.2M" />
                                <MetricCard label="Tasks completed" value="1,420" />
                            </div>
                        </section>

                        <section className={cx(stackGap)}>
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
                                                <div className={cx("grid min-w-0 grid-cols-1 items-stretch lg:grid-cols-12", gridGap)}>
                                                    <div className="min-w-0 lg:col-span-4 xl:col-span-3">
                                                        <div className="flex h-full min-h-0 flex-col justify-between gap-6 rounded-lg border-[1px] border-solid border-primary bg-primary p-4 shadow-xs sm:p-5 md:p-6">
                                                            <div className="space-y-4">
                                                                <Select
                                                                    aria-label="Metric"
                                                                    items={metricSelectItems}
                                                                    selectedKey={metric}
                                                                    onSelectionChange={(key: Key | null) => key != null && setMetric(String(key))}
                                                                    size="md"
                                                                    className="w-full"
                                                                >
                                                                    {(metricItem) => <Select.Item id={metricItem.id}>{metricItem.label}</Select.Item>}
                                                                </Select>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-baseline justify-between gap-2">
                                                                        <span className="text-lg font-semibold text-primary">2.4M</span>
                                                                        <span className="text-sm text-tertiary">Total</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-sm text-tertiary">Trend</span>
                                                                        <Badge color="success" size="sm" type="pill-color">
                                                                            +12.8%
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <ProgressBar
                                                                    value={70}
                                                                    labelPosition="bottom"
                                                                    className="rounded-full"
                                                                    progressClassName="rounded-full"
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
                                                                <UsageTrendChart />
                                                                <div className="mt-3 flex w-full min-w-0 justify-between gap-1 text-center text-xs text-tertiary sm:mt-4 sm:gap-2">
                                                                    {["Day 1", "Day 8", "Day 15", "Day 22", "Day 29", "Day 30", "Sun"].map((d) => (
                                                                        <span key={d} className="min-w-0 flex-1 truncate">
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
                            <TableCard.Root size="md" className="w-full min-w-0 border-[1px] border-solid border-primary shadow-xs ring-0">
                                <TableCard.Header
                                    title="All data"
                                    contentTrailing={
                                        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end sm:gap-3">
                                            <Button color="secondary" size="md" iconLeading={FilterFunnel01}>
                                                Filter
                                            </Button>
                                            <Dropdown.Root>
                                                <Button color="secondary" size="md" iconLeading={Share02} iconTrailing={ChevronDown}>
                                                    Export
                                                </Button>
                                                <Dropdown.Popover className="w-48">
                                                    <Dropdown.Menu>
                                                        <Dropdown.Item label="Export CSV" />
                                                        <Dropdown.Item label="Export PDF" />
                                                    </Dropdown.Menu>
                                                </Dropdown.Popover>
                                            </Dropdown.Root>
                                        </div>
                                    }
                                />
                                <Table aria-label="Project usage data" size="md">
                                    <Table.Header columns={tableColumns}>
                                        {(col) => <Table.Head id={col.id} label={col.name} isRowHeader={col.id === "project"} />}
                                    </Table.Header>
                                    <Table.Body items={tableRows}>
                                        {(row: DataRow) => (
                                            <Table.Row id={row.id} columns={tableColumns}>
                                                {(column) => (
                                                    <Table.Cell
                                                        className={cx(
                                                            column.id === "project" && "font-medium text-primary",
                                                            (column.id === "total" || column.id === "proAi" || column.id === "savings") &&
                                                                "font-medium text-primary",
                                                        )}
                                                    >
                                                        {column.id === "project" && row.project}
                                                        {column.id === "total" && row.total}
                                                        {column.id === "proAi" && row.proAi}
                                                        {column.id === "savings" && row.savings}
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
                </main>
            </div>
        </div>
    );
};
