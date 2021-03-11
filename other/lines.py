import glob

lines = 0

for filename in glob.iglob('src/**/*.ts', recursive=True):
     with open(filename, "r") as f:
     	lines += len(f.readlines())

print(lines)
