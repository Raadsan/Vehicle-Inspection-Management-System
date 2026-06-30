"use client"

import {
  ownerNameClass,
  ownerPhoneBadgeClass,
  resolveVehicleOwner,
  VehicleDisplayLike,
} from "@/lib/dashboard-ui"

type OwnerLike = { fullName?: string; phone?: string } | null | undefined

export function OwnerDisplay({
  owner,
  vehicle,
}: {
  owner?: OwnerLike;
  vehicle?: VehicleDisplayLike | null;
}) {
  const resolved = resolveVehicleOwner(vehicle, owner)
  if (!resolved?.fullName) {
    return <span className="text-zinc-400 text-sm">—</span>
  }
  return (
    <div className="flex flex-col gap-1">
      <span className={ownerNameClass}>{resolved.fullName}</span>
      {resolved.phone ? (
        <span className={ownerPhoneBadgeClass}>{resolved.phone}</span>
      ) : null}
    </div>
  )
}
