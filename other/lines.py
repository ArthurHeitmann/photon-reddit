import glob

lines = 0
files = 0

for filename in glob.iglob('src/**/*.ts', recursive=True):
     with open(filename, "r") as f:
     	lines += len(f.readlines())
     	files += 1

print("typescript stats")
print("lines", lines)
print("files", files)
