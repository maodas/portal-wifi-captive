#!/bin/bash

# Instalar dependencias para portal cautivo
sudo apt-get update
sudo apt-get install -y hostapd dnsmasq iptables-persistent

# Configurar hostapd
sudo cat > /etc/hostapd/hostapd.conf << EOF
interface=wlan0
driver=nl80211
ssid=WiFi-Gratis
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=password123
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF

# Configurar dnsmasq
sudo cat > /etc/dnsmasq.conf << EOF
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
dhcp-option=3,192.168.4.1
dhcp-option=6,192.168.4.1
server=8.8.8.8
log-queries
log-dhcp
address=/#/192.168.4.1
EOF

# Configurar red
sudo cat > /etc/network/interfaces.d/wlan0 << EOF
auto wlan0
iface wlan0 inet static
    address 192.168.4.1
    netmask 255.255.255.0
EOF

# Configurar iptables para NAT
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT

# Guardar reglas iptables
sudo netfilter-persistent save

# Configurar portal de redirección
sudo iptables -t nat -A PREROUTING -i wlan0 -p tcp --dport 80 -j DNAT --to-destination 192.168.4.1:80

# Crear página de redirección
sudo cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0;url=http://192.168.4.1:3000">
</head>
<body>
    <p>Redirigiendo al portal WiFi...</p>
</body>
</html>
EOF

echo "Configuración completa. Reinicie el sistema o ejecute:"
echo "sudo systemctl restart hostapd dnsmasq"