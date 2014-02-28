imgopt README

# Author: Joel Hardi
# Version: 0.1.2 2009-04-02
#
# For more information and usage examples, see:
# http://lyncd.com/2009/03/imgopt-lossless-optimize-png-jpeg/

The included bash script imgopt uses find to recursively locate JPEG/PNG 
files and process them with jpegtran, jfifremove, optipng, advpng and pngout, 
using settings to losslessly minimize file size and strip all metadata headers.

So, you can easily optimize every image in your website ("imgopt htdocs"), just
a single file ("imgopt favicon.png") or any combination ("imgopt favicon.png
images/ uploads/")!

Any files the script is able to reduce in size, it overwrites in place. It does
not write to or overwrite files that it cannot reduce in size.

The script is commented to make it easy for you to edit if you would like to
customize the helper programs used, or their runtime options.

By default, all image transformations are lossless. (Stripping of metadata is,
of course, not reversible.) But, there's always the possibility of bugs, and 
I'm not the author of any of the helper programs used, so I strongly suggest
that you not run this script on your only copy of a file! Use at your own risk.

The intended use of this script is the absolute minimization of file size to
maximize performance of high-traffic websites -- I recommend you use it as the
last stage in a publish/build workflow of your web graphics and always keep
original graphic source files somewhere.

Included is a small program, jfifremove.c, to strip the optional JFIF header
segment from JPEG files. I don't claim authorship -- I found it at
http://archives.devshed.com/forums/compression-130/question-about-using-jpegtran-for-lossless-compression-of-jpegs-2013044.html,
compared what it does to the JFIF segment format standard, fixed a few small
errors and named it jfifremove. I've tested it thoroughly as it is used in this
script -- deleting the JFIF segment from files that already have had all other
optional headers stripped by jpegtran. I have *not* tested it thoroughly for
standalone use (i.e. with files containing thumbnails, EXIF data) so I cannot 
recommend you use it on its own on JPEG files in the wild. This is just FYI -- I
have no reason to believe that it *isn't* OK for standalone use; I'm just 
telling you that I haven't tested it that way, so you should use caution.

------------
Installation
------------

1. imgopt is ready to run. Copy imgopt into your path and chmod it executable.
   i.e. as root or via sudo:
   cp imgopt /usr/local/bin/ && chmod a+x /usr/local/bin/imgopt

2. Compile jfifremove and copy into your path. i.e.:

   gcc -o jfifremove jfifremove.c
   # as root or via sudo:
   mv jfifremove /usr/local/bin/

   (Or, if you would rather not use jfifremove and just leave JFIF data intact,
   you can edit imgopt and delete/comment out the line that calls jfifremove.)

3. Install jpegtran (part of libjpeg so very likely already installed),
   optipng and advpng (part of AdvanceCOMP) or comment out any of these that 
   you prefer not to use. If you're on Linux, you'll likely use your package
   manager to install these (i.e. "apt-get install optipng advancecomp"). On my
   Mac, I've installed them all from source and they're all very quick
   installs; see comments in imgopt script for download locations.

   pngout is closed source; binaries are available for free download for
   Linux x86, BSD x86, Mac OS X (Intel and PPC) and Windows. See:
   http://www.jonof.id.au/index.php?p=kenutils

-----
Usage
-----

imgopt [FILE/DIR] [FILE/DIR] [FILE/DIR] ...

Optimizes any combination of files and directories. Directories are searched
recursively, and all image files in any subdirectories are optimized.

Examples:

 imgopt .      Optimize all images in current directory and any subdirectories
 imgopt *.png  Optimize all pngs in current directory only

