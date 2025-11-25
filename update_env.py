
import re

def update_env():
    new_priv = "34QmW63h8YygH1KD2gFp2bgidR2Jg86oiLz9dA1Ta2Q="
    new_pub = "9SYXQBtUhXZJDdJ/JL6f5kpq2s6yP6d+bzGgiPLGcFk="
    
    try:
        with open(".env", "r") as f:
            lines = f.readlines()
            
        new_lines = []
        keys_updated = {
            "BECKN_SIGNING_PRIVATE_KEY": False,
            "BECKN_SIGNING_PUBLIC_KEY": False,
            "BECKN_ENCRYPTION_PRIVATE_KEY": False,
            "BECKN_ENCRYPTION_PUBLIC_KEY": False
        }
        
        for line in lines:
            if line.startswith("BECKN_SIGNING_PRIVATE_KEY="):
                new_lines.append(f"BECKN_SIGNING_PRIVATE_KEY={new_priv}\n")
                keys_updated["BECKN_SIGNING_PRIVATE_KEY"] = True
            elif line.startswith("BECKN_SIGNING_PUBLIC_KEY="):
                new_lines.append(f"BECKN_SIGNING_PUBLIC_KEY={new_pub}\n")
                keys_updated["BECKN_SIGNING_PUBLIC_KEY"] = True
            elif line.startswith("BECKN_ENCRYPTION_PRIVATE_KEY="):
                new_lines.append(f"BECKN_ENCRYPTION_PRIVATE_KEY={new_priv}\n")
                keys_updated["BECKN_ENCRYPTION_PRIVATE_KEY"] = True
            elif line.startswith("BECKN_ENCRYPTION_PUBLIC_KEY="):
                new_lines.append(f"BECKN_ENCRYPTION_PUBLIC_KEY={new_pub}\n")
                keys_updated["BECKN_ENCRYPTION_PUBLIC_KEY"] = True
            else:
                new_lines.append(line)
                
        # Append if missing
        for key, updated in keys_updated.items():
            if not updated:
                val = new_priv if "PRIVATE" in key else new_pub
                new_lines.append(f"{key}={val}\n")
                
        with open(".env", "w") as f:
            f.writelines(new_lines)
            
        print("Successfully updated .env")
        
    except Exception as e:
        print(f"Error updating .env: {e}")

if __name__ == "__main__":
    update_env()
