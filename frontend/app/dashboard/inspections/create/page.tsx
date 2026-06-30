import { Suspense } from "react"
import ScheduleInspectionPage from "./page-content"

export default function CreateInspectionPage() {
  return (
    <Suspense fallback={null}>
      <ScheduleInspectionPage />
    </Suspense>
  )
}
