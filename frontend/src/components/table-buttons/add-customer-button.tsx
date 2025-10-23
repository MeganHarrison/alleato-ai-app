"use client"

import { useState } from "react"
import { CustomerForm } from "@/components/customer-form"
import { Button } from "@/components/ui/button"

export function AddCustomerButton() {
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)

  return (
    <>
      <Button onClick={() => setIsAddingCustomer(true)} className="bg-black text-white hover:bg-black/90">
        Add Customer
      </Button>
      <CustomerForm isOpen={isAddingCustomer} onClose={() => setIsAddingCustomer(false)} />
    </>
  )
}
