
import pypandoc
import sys

def test_pandoc():
    print("Checking Pandoc availability...")
    try:
        version = pypandoc.get_pandoc_version()
        print(f"Pandoc version: {version}")
        print(f"Pandoc path: {pypandoc.get_pandoc_path()}")
    except Exception as e:
        print(f"Pandoc check failed: {e}")
        print("Attempting to download pandoc...")
        try:
            pypandoc.download_pandoc()
            print("Pandoc downloaded successfully.")
        except Exception as download_error:
            print(f"Failed to download pandoc: {download_error}")
            return

    print("\nTesting Grid Table Conversion...")
    grid_table = """
+---------------------+-----------------------+
| Location            | Temperature           |
+=====================+=======================+
| Greenland           | -23.0                 |
+---------------------+-----------------------+
"""
    try:
        # Convert output to gfm (GitHub Flavored Markdown)
        output = pypandoc.convert_text(grid_table, 'gfm', format='markdown')
        print("\n--- Converted Output (GFM) ---")
        print(output)
        print("------------------------------")
        
        if "|" in output and "+---" not in output:
            print("SUCCESS: Grid table converted to Pipe table.")
        else:
            print("WARNING: Conversion might not have produced pipe tables as expected.")
            
    except Exception as e:
        print(f"Conversion failed: {e}")

if __name__ == "__main__":
    test_pandoc()
