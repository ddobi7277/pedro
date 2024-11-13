import subprocess
import re
import socket

def check_if_rule_exists(proto, port, ip):
    output = subprocess.check_output(['sudo', 'ufw', 'status', 'numbered']).decode('utf-8')
    lines = output.split('\n')
    for line in lines:
        if re.search(ip, line) and re.search(str(port), line):
            return True
    return False

def add_rule(proto, port, ip):
    subprocess.call(['sudo', 'ufw', 'allow', 'proto', proto, 'from', ip, 'to', 'any', 'port', str(port)])

def delete_rule(proto, port, ip):
    subprocess.call(['sudo', 'ufw', 'delete', 'allow', 'proto', proto, 'from', ip, 'to', 'any', 'port', str(port)])

def get_ip(domain):
    output = subprocess.check_output(['nslookup', domain]).decode('utf-8')
    ips = re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', output)
    return ips

def main():
    domains = ["www.cubaunify.uk"]  # Add domains here
    port = 8000
    proto = "tcp"

    all_ips = []
    for domain in domains:
        mip = get_ip(domain)
        for ip in mip:
            all_ips.append(ip)
            print(f"The IP for {domain} is: {ip}")

    with open("ips.txt", "w") as f:
        for ip in all_ips:
            f.write(ip + "\n")

    with open("ips.txt", "r") as f:
        ips = f.readlines()
        for ip in ips:
            ip = ip.strip()
            exists = check_if_rule_exists(proto, port, ip)
            if exists:
                delete_rule(proto, port, ip)
                print(f"Deleted existing rule for {ip}")
            add_rule(proto, port, ip)
            print(f"Added new rule for {ip}")


if __name__ == "__main__":
    main()

