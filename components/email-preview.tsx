"use client";

import { ReactNode } from "react";
import { GrabbableEmail } from "./grab";

interface EmailPreviewProps {
  children: ReactNode;
  onChange?: (values: Record<string, string>) => void;
}

export function EmailPreview({ children, onChange }: EmailPreviewProps) {
  return (
    <div className="flex justify-center p-5">
      {/* iPhone 15 Pro Frame - 393x852 logical resolution, scaled down */}
      <div className="relative w-[290px] h-[590px] bg-[#1C1C1E] rounded-[55px] p-[10px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5),0_30px_60px_-30px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.1)]">
        {/* Titanium band effect */}
        <div className="absolute inset-[3px] rounded-[52px] bg-linear-to-br from-[#48484A] via-[#2C2C2E] to-[#1C1C1E] pointer-events-none" />

        {/* Dynamic Island */}
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[95px] h-[28px] bg-black rounded-full z-20 flex items-center justify-end pr-[10px] gap-[6px]">
          {/* Front camera */}
          <div className="w-[10px] h-[10px] rounded-full bg-[#1C1C1E] ring-[1.5px] ring-[#2C2C2E]">
            <div className="w-full h-full rounded-full bg-linear-to-br from-[#2C3E50] to-[#1a1a2e] opacity-80" />
          </div>
        </div>

        {/* Left buttons - Action button */}
        <div className="absolute -left-[2px] top-[85px] w-[3px] h-[28px] bg-[#3A3A3C] rounded-l-sm" />
        {/* Volume up */}
        <div className="absolute -left-[2px] top-[130px] w-[3px] h-[45px] bg-[#3A3A3C] rounded-l-sm" />
        {/* Volume down */}
        <div className="absolute -left-[2px] top-[185px] w-[3px] h-[45px] bg-[#3A3A3C] rounded-l-sm" />

        {/* Right button - Power */}
        <div className="absolute -right-[2px] top-[145px] w-[3px] h-[70px] bg-[#3A3A3C] rounded-r-sm" />

        {/* Screen */}
        <div className="relative w-full h-full bg-black rounded-[45px] overflow-hidden z-10">
          {/* iOS Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-[44px] flex items-end justify-between px-[24px] pb-[10px] z-30 bg-linear-to-b from-black/20 to-transparent">
            {/* Time - left of Dynamic Island */}
            <span
              className="text-white text-[15px] font-semibold tracking-[-0.3px]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              }}
            >
              9:41
            </span>

            {/* Status icons - right of Dynamic Island */}
            <div className="flex items-center gap-[4px]">
              {/* Cellular Signal */}
              <svg
                width="18"
                height="12"
                viewBox="0 0 18 12"
                className="fill-white"
              >
                <rect x="0" y="7" width="3" height="5" rx="0.5" />
                <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
                <rect x="9" y="3" width="3" height="9" rx="0.5" />
                <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
              </svg>

              {/* WiFi */}
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                className="fill-white"
              >
                <path d="M8 10.2a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                <path
                  d="M4.93 8.47a4.3 4.3 0 016.14 0l-.86.86a3.1 3.1 0 00-4.42 0l-.86-.86z"
                  opacity="1"
                />
                <path
                  d="M2.81 6.34a7.08 7.08 0 0110.38 0l-.86.86a5.87 5.87 0 00-8.66 0l-.86-.86z"
                  opacity="1"
                />
                <path
                  d="M.69 4.22a9.86 9.86 0 0114.62 0l-.86.86a8.65 8.65 0 00-12.9 0l-.86-.86z"
                  opacity="1"
                />
              </svg>

              {/* Battery */}
              <div className="flex items-center">
                <div className="relative w-[22px] h-[11px] rounded-[2.5px] border border-white/35">
                  <div className="absolute inset-[2px] right-[2px] bg-white rounded-[1px]" />
                </div>
                <div className="w-[1.5px] h-[4px] bg-white/35 rounded-r-sm ml-px" />
              </div>
            </div>
          </div>

          {/* Email content - Automatically parsed to grabbable */}
          <div
            className="absolute top-[44px] left-0 right-0 bottom-[28px] overflow-y-auto bg-[#f6f9fc]"
            style={{
              fontFamily:
                '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
            }}
          >
            <GrabbableEmail onChange={onChange}>{children}</GrabbableEmail>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[120px] h-[5px] bg-white rounded-full z-30" />
        </div>
      </div>
    </div>
  );
}
