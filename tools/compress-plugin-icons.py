#!/usr/bin/python
import sys
import os
import Image
import ImageDraw
import math
import glob

folder = 'style/icons'

images = []
css_rules = {}

with open('style/icons/source.css') as css_file:
	css_data = css_file.read()

	for line in css_data.split('\n'):
		if len(line) < 1 or line[0] != '.' or line[:9] == '.icon-img':
			continue
		
		css_rules[line.split(' ')[0]] = line.split('\'')[1]

# A source image structure that loads the image and stores the
# extents. It will also get the destination rect in the atlas written to it.
class SourceImage:
	def __init__(self, filePath, fileName, oi):
		self.filePath = filePath
		self.fileName = fileName
		self.fullPath = filePath + '/' + fileName
		self.origIndex = oi
		
		# Open the image and make sure it's in RGBA mode.
		self.img = Image.open(self.fullPath)
		self.img = self.img.convert('RGBA')
		self.uncropped = Rect(0,0, self.img.size[0]-1, self.img.size[1]-1)
		
		# Grab the bounding box from the alpha channel.
		# alpha = self.img.split()[3]
		# bbox = alpha.getbbox()
		# alpha = None
		
		# if bbox == None:
		#	bbox = [0,0,1,1];
		bbox = [0, 0, self.img.size[0]-1, self.img.size[1]-1]
		
		# Crop it and get the new extents.
		self.img = self.img.crop(bbox)
		self.img.load()
		self.offset = (bbox[0], bbox[1])
		self.rect = Rect(0,0, self.img.size[0]-1, self.img.size[1]-1)

# A simple rect class using inclusive coordinates.
class Rect:
	def __init__(self, x0,y0,x1,y1):
		self.xmin = int(x0)
		self.xmax = int(x1)
		self.ymin = int(y0)
		self.ymax = int(y1)
	
	def width(self):
		return int(self.xmax - self.xmin + 1)
	
	def height(self):
		return int(self.ymax - self.ymin + 1)

# A k-d tree node containing rectangles used to tightly pack images.
class Node:
	def __init__(self):
		self.image = None
		self.rect = Rect(0,0,0,0)
		self.child0 = None
		self.child1 = None

  # Iterate the full tree and write the destination rects to the source images.
	def finalize(self):
		if self.image != None:
			self.image.destRect = self.rect
		else:
			if self.child0 != None:
				self.child0.finalize()
			if self.child1 != None:
				self.child1.finalize()
	
	# Insert a single rect into the tree by recursing into the children.
	def insert(self, r, img):
		if self.child0 != None or self.child1 != None:
			newNode = self.child0.insert(r, img)
			
			if newNode != None:
				return newNode
			
			return self.child1.insert(r, img)
		else:
			if self.image != None:
				return None
		
			if r.width() > self.rect.width() or r.height() > self.rect.height():
				return None
		
			if r.width() == self.rect.width() and r.height() == self.rect.height():
				self.image = img
				return self
			
			self.child0 = Node()
			self.child1 = Node()
			dw = self.rect.width() - r.width()
			dh = self.rect.height() - r.height()
		
			if dw > dh:
				self.child0.rect = Rect(self.rect.xmin, self.rect.ymin, self.rect.xmin + r.width() - 1, self.rect.ymax)
				self.child1.rect = Rect(self.rect.xmin + r.width(), self.rect.ymin, self.rect.xmax, self.rect.ymax)
			else:
				self.child0.rect = Rect(self.rect.xmin, self.rect.ymin, self.rect.xmax, self.rect.ymin + r.height() - 1)
				self.child1.rect = Rect(self.rect.xmin, self.rect.ymin + r.height(), self.rect.xmax, self.rect.ymax)
		
			return self.child0.insert(r,img)

def writeAtlas(images, atlasW, atlasH):
	atlasImg = Image.new('RGBA', [atlasW, atlasH])
	
	for i in images:
		atlasImg.paste(i.img, [int(i.img.destRect.xmin), int(i.img.destRect.ymin), int(i.img.destRect.xmax + 1), int(i.img.destRect.ymax + 1)])
	
	atlasImg.save('build/style/icons/icons.png')
	atlasImg = None

def writeCSS(images, atlasW, atlasH):
	css = open('build/style/icons/style.css', 'w')
	
	#    css.write('  padding-left: ' + str(i.offset[0]) + 'px;\n')
	#    css.write('  padding-top: ' + str(i.offset[1]) + 'px;\n')
	#    css.write('  padding-right: ' + str(i.uncropped.width() - i.img.destRect.width() - i.offset[0]) + 'px;\n')
	#    css.write('  padding-bottom: ' + str(i.uncropped.height() - i.img.destRect.height() - i.offset[1]) + 'px;\n')
	
	css.write('.icon-img\n{\n')
	css.write('\tdisplay: block;\n')
	css.write('\tfloat: left;\n')
	css.write('\tposition: relative !important;\n')
	css.write('\ttop: 2px !important;\n')
	css.write('\tpadding: 0px !important;\n')
	css.write('\tmargin: 0px !important;\n')
	css.write('\tmargin-right: 2px !important;\n')
	css.write('\twidth: 15px !important;\n')
	css.write('\theight: 15px !important;\n')
	css.write('\tbackground-clip: content-box !important;\n}\n\n')
		
	for rule in sorted(css_rules.keys()):
		img_fname = css_rules[rule]
		
		for i in images:
			if i.fileName == img_fname:
				css.write(rule + ' { ')
				#css.write('width: ' + str(i.img.destRect.width()) + 'px; ')
				#css.write('height: ' + str(i.img.destRect.height()) + 'px; ')
				css.write('background: url(\'icons.png\') ' + str(-i.img.destRect.xmin+i.offset[0]) + 'px ' + str(-i.img.destRect.ymin+i.offset[1]) + 'px no-repeat; }\n')
	
	css.close()

originalIndex = 0

def addFolder(folder):
	global originalIndex

	folderList = os.listdir(folder);
	
	for folderName in folderList:
		if folderName[0] == '.':
			continue
		
		fullPath = folder + '/' + folderName
		
		if os.path.isdir(fullPath) == True:
			addFolder(fullPath)
		else:
			# Create source image structs and give them a unique index.
			if fullPath[-4:] == '.png' and fullPath[-9:] != 'icons.png':
				images.append(SourceImage(folder, folderName, originalIndex))
				originalIndex = originalIndex + 1

print 'Building CSS sprite sheet from images in ' + folder
addFolder(folder)

# An alternate heuristic for insertion order.
def imageArea(i):
	return i.rect.width() * i.rect.height()

# The used heuristic for insertion order, inserting images with the
# largest extent (in any direction) first.
def maxExtent(i):
	return max([i.rect.width(), i.rect.height()])
	
# Sort the source images using the insert heuristic.
images.sort(None, maxExtent, True)

# Calculate the total area of all the source images and figure out a starting
# width and height to use when creating the atlas.
totalArea = 0
totalAreaUncropped = 0

for i in images:
	totalArea = totalArea + i.rect.width() * i.rect.height()
	totalAreaUncropped = totalAreaUncropped + i.uncropped.width() * i.uncropped.height()

width = math.floor(math.sqrt(totalArea))
height = math.floor(totalArea / width)

# Loop until success.
while True:
	# Set up an empty tree the size of the expected atlas.
	root = Node()
	root.rect = Rect(0, 0, width, height)
	
	# Try to insert all the source images.
	ok = True
	
	for i in images:
		n = root.insert(i.rect, i.img)
		if n == None:
			ok = False
			break
	
	# If all source images fit break out of the loop.
	if ok:
		break
	
	# Increase the width or height by one and try again.
	if width > height:
		height = height + 1
	else:
		width = width + 1

# We've succeeded so write the dest rects to the source images.
root.finalize()
root = None

# Figure out the actual size of the atlas as it may not fill the entire area.
atlasW = 0
atlasH = 0

for i in images:
	atlasW = max([atlasW, i.img.destRect.xmax])
	atlasH = max([atlasH, i.img.destRect.ymax])
  
atlasW = int(atlasW+1)
atlasH = int(atlasH+1)
print('AtlasDimensions: ' + str(atlasW) + 'x' + str(atlasH) + '  :  ' + str(int(100.0 * (atlasW * atlasH)/totalAreaUncropped)) + '% of original')

writeAtlas(images, atlasW, atlasH)

"""for i in images:
	ofs = [i.offset[0], i.offset[1]]
	
	if ofs[0] != 0:
		ofs[0] -= 1
	
	if ofs[1] != 0:
		ofs[1] -= 1
	
	i.offset = (ofs[0], ofs[1])"""

writeCSS(images, atlasW, atlasH)
