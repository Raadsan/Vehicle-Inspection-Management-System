"use client"

import React, { forwardRef, useEffect, useRef } from "react"
import Image from "next/image"
import { Inspection, Vehicle } from "@/lib/api"
import { cn } from "@/lib/utils"

/** Logo / brand palette */
const COLORS = {
  navy: "#0a2744",
  blue: "#4189DD",
  goldLight: "#f5e6b8",
  goldMid: "#e8c96e",
  goldDeep: "#d4a843",
  white: "#ffffff",
}

type VehicleWithOwners = Vehicle & {
  vehicleOwners?: { owner?: { fullName?: string; phone?: string } }[]
}

export function formatCertificateDate(value?: string | Date | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function getCertificateIssueDate(inspection: Inspection): Date | null {
  const raw = inspection.approvedAt || inspection.completedAt || inspection.createdAt
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export function getCertificateExpiryDate(inspection: Inspection): Date | null {
  if (inspection.expiresAt) {
    const d = new Date(inspection.expiresAt)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const issue = getCertificateIssueDate(inspection)
  if (!issue) return null
  const expiry = new Date(issue)
  expiry.setFullYear(expiry.getFullYear() + 1)
  expiry.setDate(expiry.getDate() - 1)
  return expiry
}

export function getCertificateSerial(inspection: Inspection): string {
  return `A${String(inspection.id).padStart(5, "0")}`
}

export function buildBarcodePayload(inspection: Inspection): string {
  const vehicle = inspection.vehicle
  const issue = formatCertificateDate(getCertificateIssueDate(inspection))
  const expiry = formatCertificateDate(getCertificateExpiryDate(inspection))
  return [
    getCertificateSerial(inspection),
    vehicle?.plateNumber || "",
    vehicle?.vin || "",
    issue,
    expiry,
  ].join("|")
}

function SomaliaLogo({ className }: { className?: string }) {
  const [imgFailed, setImgFailed] = React.useState(false)

  if (imgFailed) {
    return (
      <svg viewBox="0 0 72 84" className={cn("w-[92px] h-[108px] shrink-0", className)} aria-hidden>
        <rect x="16" y="8" width="40" height="46" rx="3" fill={COLORS.blue} stroke={COLORS.navy} strokeWidth="1.2" />
        <polygon points="36,20 39,28 48,28 41,33 43,41 36,37 29,41 31,33 24,28 33,28" fill="white" />
      </svg>
    )
  }

  return (
    <Image
      src="/small logo.png"
      alt="Logo"
      width={92}
      height={108}
      className={cn("object-contain w-[92px] h-[108px] shrink-0", className)}
      unoptimized
      onError={() => setImgFailed(true)}
    />
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] items-center gap-3 w-full">
      <span
        className="text-[11px] font-bold uppercase leading-tight"
        style={{ color: COLORS.navy }}
      >
        {label}
      </span>
      <div
        className="h-10 flex items-center px-4 rounded-lg border"
        style={{
          backgroundColor: COLORS.white,
          borderColor: `${COLORS.blue}55`,
        }}
      >
        <span
          className="text-sm font-bold truncate w-full"
          style={{ color: COLORS.navy }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

function ScannableBarcode({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !value) return

    let cancelled = false

    import("@bwip-js/browser")
      .then((mod) => {
        if (cancelled) return
        const bwipjs = mod.default
        try {
          bwipjs.toCanvas(canvas, {
            bcid: "pdf417",
            text: value,
            scale: 1.8,
            height: 8,
            includetext: false,
            paddingwidth: 4,
            paddingheight: 4,
          })
        } catch {
          bwipjs.toCanvas(canvas, {
            bcid: "code128",
            text: value,
            scale: 2,
            height: 12,
            includetext: false,
          })
        }
      })
      .catch(() => {
        /* canvas stays blank */
      })

    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <div
      className="w-full rounded-lg overflow-hidden flex justify-center"
      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.blue}44` }}
    >
      <canvas ref={canvasRef} className="w-full max-w-full h-auto block" />
    </div>
  )
}

interface InspectionAcceptanceCertificateProps {
  inspection: Inspection
  className?: string
}

export const InspectionAcceptanceCertificate = forwardRef<
  HTMLDivElement,
  InspectionAcceptanceCertificateProps
>(function InspectionAcceptanceCertificate({ inspection, className }, ref) {
  const vehicle = inspection.vehicle as VehicleWithOwners | undefined
  const issueDate = getCertificateIssueDate(inspection)
  const expiryDate = getCertificateExpiryDate(inspection)
  const certNo = getCertificateSerial(inspection)
  const barcodeValue = buildBarcodePayload(inspection)

  const fields = [
    { label: "CERT NO", value: certNo },
    { label: "PLATE NO", value: vehicle?.plateNumber || "—" },
    { label: "CHASE NO", value: vehicle?.vin || "—" },
    { label: "TAR BIXINTA", value: formatCertificateDate(issueDate) },
    { label: "TAR DHICISTA", value: formatCertificateDate(expiryDate) },
  ]

  return (
    <div
      ref={ref}
      className={cn("cert-print relative mx-auto w-full max-w-[420px]", className)}
      style={{
        background: `linear-gradient(180deg, ${COLORS.goldLight} 0%, ${COLORS.goldMid} 50%, ${COLORS.goldDeep} 100%)`,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Header — logo + text aligned together, vertically centered */}
        <div className="flex items-center gap-4">
          <SomaliaLogo />
          <div className="flex-1 flex flex-col justify-center min-w-0 space-y-2">
            <p
              className="text-[12px] font-bold uppercase leading-snug"
              style={{ color: COLORS.navy }}
            >
              Wasaaradda Gaadiidka iyo Duulista Hawada
            </p>
            <p
              className="text-[11px] font-bold uppercase leading-snug"
              style={{ color: COLORS.navy }}
            >
              Xafiiska Tijaabada Badqabka Gaadiidka Rayidka (PRA)
            </p>
          </div>
        </div>

        {/* Fields — same size white rounded-lg boxes (matches app buttons) */}
        <div className="flex flex-col gap-3">
          {fields.map(({ label, value }) => (
            <FieldRow key={label} label={label} value={value} />
          ))}
        </div>

        {/* Real scannable barcode */}
        <ScannableBarcode value={barcodeValue} />
      </div>
    </div>
  )
})

export function printAcceptanceCertificate(element: HTMLElement) {
  const printWindow = window.open("", "_blank", "width=520,height=780")
  if (!printWindow) return

  const canvas = element.querySelector("canvas")
  let canvasHtml = ""
  if (canvas instanceof HTMLCanvasElement && canvas.width > 0) {
    const dataUrl = canvas.toDataURL("image/png")
    canvasHtml = `<img src="${dataUrl}" alt="barcode" style="width:100%;height:auto;display:block;" />`
  }

  const clone = element.cloneNode(true) as HTMLElement
  const cloneCanvas = clone.querySelector("canvas")
  if (cloneCanvas && canvasHtml) {
    const wrapper = document.createElement("div")
    wrapper.innerHTML = canvasHtml
    cloneCanvas.replaceWith(wrapper.firstElementChild!)
  }

  const styles = `
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; display: flex; justify-content: center; background: #fff; }
    .cert-print { max-width: 420px !important; width: 100%; }
    @page { size: auto; margin: 8mm; }
  `

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Waraqa Aqbalada</title>
        <style>${styles}</style>
      </head>
      <body>${clone.outerHTML}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
}
