path = r"O:\AI\E-tic 2026\src\pages\SellerStore.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Count occurrences of "Sidebar Info" to see if duplicated
count = content.count("Sidebar Info")
print(f"Sidebar Info count: {count}")
# Count "Küresel"
count2 = content.count("Küresel")
print(f"Küresel count: {count2}")
# Check for sidebar with profile
count3 = content.count("Seller Profile Card")
print(f"Seller Profile Card count: {count3}")
