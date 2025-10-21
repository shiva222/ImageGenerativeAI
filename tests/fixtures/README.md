# Test Fixtures

This directory contains test files used by the E2E tests.

## Required Files

- `test-image.jpg` - A sample JPEG image for upload testing (should be < 10MB)
- `test-document.txt` - A text file for testing invalid file type handling

## Creating Test Files

To create the required test fixtures:

```bash
# Create a simple text file
echo "This is a test document for invalid file type testing" > test-document.txt

# For the test image, you can:
# 1. Copy any small JPEG image and rename it to test-image.jpg
# 2. Use ImageMagick to create one: convert -size 100x100 xc:blue test-image.jpg
# 3. Download a sample image from the internet
```

Note: The actual image files are not committed to version control to keep the repository size small.
