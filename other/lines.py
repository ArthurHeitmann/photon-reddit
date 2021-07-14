import glob

lines = 0
files = 0

for filename in glob.iglob('src/**/*.ts', recursive=True):
     with open(filename, "r") as f:
     	lineCount = len(f.readlines())
     	if lineCount > 400:
     		print(filename + ": " + str(lineCount))
     	lines += lineCount
     	files += 1

print("typescript stats")
print("lines", lines)
print("files", files)
