# terraform/variables.tf

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
  default     = "f53ae43d-8447-4a97-bb07-74efb4daf47b"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "malaysiawest"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "co3404-rg"
}

variable "admin_username" {
  description = "VM admin username"
  type        = string
  default     = "azureuser"
}

variable "admin_password" {
  description = "VM admin password"
  type        = string
  sensitive   = true
  default     = "Co3404Jokes!2025"
}

variable "vm_size_small" {
  description = "Small VM size (submit, kong, moderate)"
  type        = string
  default     = "Standard_B2als_v2"
}

variable "vm_size_medium" {
  description = "Medium VM size (joke + ETL + DB)"
  type        = string
  default     = "Standard_B2ats_v2"
}
