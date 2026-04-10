"use client";

import React from "react";
import { Check } from "lucide-react";

export interface StepItem {
    label: string;
    description?: string;
    optional?: boolean;
    completed?: boolean;
    error?: boolean;
}

export interface StepperProps {
    steps: StepItem[];
    activeStep?: number;
    orientation?: "horizontal" | "vertical";
    onStepClick?: (index: number) => void;
    className?: string;
}

export function Stepper({ steps, activeStep = 0, orientation = "horizontal", onStepClick, className = "" }: StepperProps) {
    if (orientation === "vertical") {
        return (
            <div className={`flex flex-col ${className}`}>
                {steps.map((step, idx) => {
                    const isDone = step.completed || idx < activeStep;
                    const isCurrent = idx === activeStep;
                    const isError = step.error;
                    return (
                        <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <button
                                    type="button"
                                    onClick={() => onStepClick?.(idx)}
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors focus:outline-none ${onStepClick ? "cursor-pointer" : "cursor-default"}`}
                                    style={{
                                        backgroundColor: isError ? "#ef4444" : isDone ? "var(--gogo-primary)" : isCurrent ? "var(--gogo-primary)" : "var(--gogo-grey-100)",
                                        color: isDone || isCurrent ? "#fff" : isError ? "#fff" : "var(--gogo-text-secondary)",
                                    }}
                                    aria-label={step.label}
                                >
                                    {isDone && !isError ? <Check className="w-4 h-4" /> : <span>{idx + 1}</span>}
                                </button>
                                {idx < steps.length - 1 && (
                                    <div className="w-0.5 flex-1 my-1 min-h-[1.5rem]" style={{ backgroundColor: isDone ? "var(--gogo-primary)" : "var(--gogo-divider)" }} />
                                )}
                            </div>
                            <div className={`pb-6 ${idx === steps.length - 1 ? "" : ""}`}>
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: isCurrent ? "var(--gogo-text-primary)" : isDone ? "var(--gogo-text-primary)" : "var(--gogo-text-secondary)" }}
                                >
                                    {step.label}
                                    {step.optional && <span className="ml-1 text-xs font-normal" style={{ color: "var(--gogo-text-secondary)" }}>(Optional)</span>}
                                </p>
                                {step.description && (
                                    <p className="text-xs mt-0.5" style={{ color: "var(--gogo-text-secondary)" }}>{step.description}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={`flex items-start ${className}`}>
            {steps.map((step, idx) => {
                const isDone = step.completed || idx < activeStep;
                const isCurrent = idx === activeStep;
                const isError = step.error;
                const isLast = idx === steps.length - 1;
                return (
                    <React.Fragment key={idx}>
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={() => onStepClick?.(idx)}
                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors focus:outline-none ${onStepClick ? "cursor-pointer" : "cursor-default"}`}
                                style={{
                                    backgroundColor: isError ? "#ef4444" : isDone ? "var(--gogo-primary)" : isCurrent ? "var(--gogo-primary)" : "var(--gogo-grey-100)",
                                    color: isDone || isCurrent ? "#fff" : isError ? "#fff" : "var(--gogo-text-secondary)",
                                }}
                                aria-label={step.label}
                            >
                                {isDone && !isError ? <Check className="w-4 h-4" /> : <span>{idx + 1}</span>}
                            </button>
                            <p
                                className="mt-1 text-xs text-center max-w-[5rem]"
                                style={{ color: isCurrent ? "var(--gogo-text-primary)" : "var(--gogo-text-secondary)", fontWeight: isCurrent ? 600 : 400 }}
                            >
                                {step.label}
                            </p>
                        </div>
                        {!isLast && (
                            <div className="flex-1 h-0.5 mt-4 mx-1" style={{ backgroundColor: isDone ? "var(--gogo-primary)" : "var(--gogo-divider)" }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
