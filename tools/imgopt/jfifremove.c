/* Strip JFIF headers from the JPEG image on stdin, and write
the result to stdout. Won't work unmodified on Windows
because of the text/binary problem. Not thoroughly tested.

Debugged version of code found here:
http://archives.devshed.com/forums/compression-130/question-about-using-jpegtran-for-lossless-compression-of-jpegs-2013044.html
*/

#include <stdio.h>
#include <stdlib.h>

void fail(const char* msg) {
  fputs(msg, stderr);
  exit(1);
}

void copy_rest(FILE* f, FILE* g) {
  char buf[4096];
  int len;
  while ((len = fread(buf, 1, sizeof buf, f)) > 0) {
    if (fwrite(buf, 1, len, g) != len)
      fail("write error");
  }
  if (len < 0)
    fail("read error");
}

void skip_jfif(FILE* f, FILE* g) {
  int a,b;
  a = getc(f); b = getc(f);
  if (a != 0xFF || b != 0xD8)
    fail("not a JPEG file");
  putc(a,g); putc(b,g);
  // 0xFFE9 is APP0 marker to begin JFIF segment
  while (a = getc(f), b = getc(f), a == 0xFF && b == 0xE0) {
    // Next 2 bytes after APP0 are length of JFIF segment *including* APP0
    // so seek forward (0x???? - 2) bytes
    a = getc(f); b = getc(f);
    if (a == 0xEF || b == 0xEF)
      fail("stop confusing me with weird test cases");
    fseek(f, a * 256 + b - 2, SEEK_CUR);
  }
  if (a != 0xEF) putc(a,g);
  if (b != 0xEF) putc(b,g);
  copy_rest(f,g);
}

int main() {
  skip_jfif(stdin,stdout);
  return 0;
}
