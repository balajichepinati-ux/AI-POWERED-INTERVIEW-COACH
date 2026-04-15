import shutil

# Copy Rupesh's photo
shutil.copy2(r"C:\Users\Balaji\.gemini\antigravity\brain\05fd239b-141c-4788-ac09-258f6ca24ea3\media__1775627292706.jpg", r"c:\Users\Balaji\Downloads\MockMate-main (1)\MockMate-main\frontend\public\team_rupesh.png")

# Copy Balaji's newer photo
shutil.copy2(r"C:\Users\Balaji\.gemini\antigravity\brain\05fd239b-141c-4788-ac09-258f6ca24ea3\media__1775628680035.jpg", r"c:\Users\Balaji\Downloads\MockMate-main (1)\MockMate-main\frontend\public\team_balaji.png")

print("Files copied successfully!")
