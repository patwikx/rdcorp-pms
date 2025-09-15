"use client"


import { useEffect } from "react"
import { useBusinessUnitModal } from "@/hooks/use-bu-modal"


const SetupPage = () => {
  const onOpen = useBusinessUnitModal((state) => state.onOpen)
  const isOpen = useBusinessUnitModal((state) => state.isOpen)

  useEffect(() => {
    if (!isOpen) {
      onOpen()
    }
  }, [isOpen, onOpen])

  return null
}
 
export default SetupPage