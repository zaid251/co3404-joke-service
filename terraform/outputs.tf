# terraform/outputs.tf

output "app_vm_public_ip" {
  description = "Public IP of App VM (joke + ETL + DB)"
  value       = azurerm_public_ip.app_pip.ip_address
}

output "submit_vm_public_ip" {
  description = "Public IP of Submit VM (submit + RabbitMQ)"
  value       = azurerm_public_ip.submit_pip.ip_address
}

output "kong_vm_public_ip" {
  description = "Public IP of Kong VM (gateway + moderate)"
  value       = azurerm_public_ip.kong_pip.ip_address
}

output "private_ips" {
  value = {
    app_vm    = "10.0.1.10"
    submit_vm = "10.0.1.11"
    kong_vm   = "10.0.1.12"
  }
}

output "access_urls" {
  value = {
    joke_ui    = "http://${azurerm_public_ip.app_pip.ip_address}:3001"
    submit_ui  = "http://${azurerm_public_ip.submit_pip.ip_address}:3002"
    moderate   = "http://${azurerm_public_ip.kong_pip.ip_address}:3003"
    kong_http  = "http://${azurerm_public_ip.kong_pip.ip_address}"
    kong_https = "https://${azurerm_public_ip.kong_pip.ip_address}"
    kong_admin = "http://${azurerm_public_ip.kong_pip.ip_address}:8001"
    rabbitmq   = "http://${azurerm_public_ip.submit_pip.ip_address}:15672"
  }
}
