"use client"

import * as React from "react"
import { LayoutGrid, Settings } from "lucide-react"

import { Button } from "./button"
import { Separator } from "./separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet"
import { Tabs, TabsList, TabsTrigger } from "./tabs"
import { cn } from "../../lib/utils"

export type MobileTabItem = {
  id: number
  label: string
  value: string
  icon?: React.ReactNode
}

export interface MobileTabListProps {
  tabs: MobileTabItem[]
  showNavigationButton?: boolean
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  sheetTitle?: string
  sheetDescription?: string
  sheetIcon?: React.ReactNode
}

export const MobileTabList = React.forwardRef<
  HTMLDivElement,
  MobileTabListProps
>(
  (
    {
      tabs,
      showNavigationButton = false,
      value,
      defaultValue,
      onValueChange,
      sheetTitle = "Menu",
      sheetDescription = "Navigate between sections",
      sheetIcon,
    },
    ref
  ) => {
    const [activeTabIndex, setActiveTabIndex] = React.useState<number>(0)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(
      defaultValue ?? tabs[0]?.value ?? ""
    )
    const tabsListRef = React.useRef<HTMLDivElement>(null)

    const isControlled = value !== undefined
    const activeValue = isControlled ? value : internalValue

    React.useEffect(() => {
      const checkActiveTab = () => {
        if (tabsListRef.current) {
          const activeTrigger = tabsListRef.current.querySelector(
            '[data-state="active"]'
          )
          if (activeTrigger) {
            const allTriggers =
              tabsListRef.current.querySelectorAll('[role="tab"]')
            const index = Array.from(allTriggers).indexOf(activeTrigger)
            if (index !== -1) {
              setActiveTabIndex(index)

              if (activeTrigger instanceof HTMLElement) {
                activeTrigger.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "center",
                })
              }
            }
          }
        }
      }

      checkActiveTab()

      const observer = new MutationObserver(checkActiveTab)
      if (tabsListRef.current) {
        observer.observe(tabsListRef.current, {
          attributes: true,
          subtree: true,
          attributeFilter: ["data-state"],
        })
      }

      return () => observer.disconnect()
    }, [])

    const isFirstTabSelected = activeTabIndex === 0
    const isLastTabSelected = activeTabIndex === tabs.length - 1

    const handleTabSelect = (tabValue: string) => {
      if (!isControlled) setInternalValue(tabValue)
      onValueChange?.(tabValue)
      setIsSheetOpen(false)
    }

    const handleValueChange = (tabValue: string) => {
      if (!isControlled) setInternalValue(tabValue)
      onValueChange?.(tabValue)
    }

    return (
      <>
        <div ref={ref} className="relative">
          <div className="scrollbar-hide mx-1 my-4 overflow-x-auto pb-1">
            <Tabs value={activeValue} onValueChange={handleValueChange}>
              <TabsList
                ref={tabsListRef}
                className="flex w-max min-w-full justify-start gap-2 bg-transparent"
              >
                {showNavigationButton && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSheetOpen(true)}
                      className="ml-5 gap-2 rounded-full border bg-background"
                      aria-label="Open tab navigation"
                    >
                      <LayoutGrid className="h-5 w-5 text-gray-400" />
                    </Button>

                    <Separator orientation="vertical" className="h-full" />
                  </>
                )}

                {tabs.map((tab, index) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.value}
                    className={cn(
                      "gap-2 rounded-full border bg-background data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-900",
                      index === 0 && !showNavigationButton && "ml-1",
                      index === tabs.length - 1 && "mr-1"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {!isFirstTabSelected && (
            <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-background to-transparent" />
          )}

          {!isLastTabSelected && (
            <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-background to-transparent" />
          )}
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent
            side="left"
            className="w-[280px] rounded-lg sm:w-[320px]"
          >
            <SheetHeader className="space-y-3 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/20">
                  {sheetIcon ?? (
                    <Settings className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  )}
                </div>
                <SheetTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {sheetTitle}
                </SheetTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sheetDescription}
              </p>
            </SheetHeader>
            <Separator className="mb-4" />
            <div className="flex flex-col gap-2 py-1">
              {tabs.map((tab) => {
                const isActive = activeValue === tab.value
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabSelect(tab.value)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-brand-900/10",
                      isActive
                        ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20"
                        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-600 group-hover:bg-brand-100 group-hover:text-brand-600 dark:bg-gray-700 dark:text-gray-400 dark:group-hover:bg-brand-900/30 dark:group-hover:text-brand-400"
                      )}
                    >
                      {tab.icon}
                    </div>
                    <span
                      className={cn(
                        "flex-1 text-sm font-medium transition-colors",
                        isActive
                          ? "text-brand-900 dark:text-brand-100"
                          : "text-gray-700 group-hover:text-brand-900 dark:text-gray-300 dark:group-hover:text-brand-100"
                      )}
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-brand-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }
)
MobileTabList.displayName = "MobileTabList"
