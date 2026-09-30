with open('backend/generate_mock_data.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('"data/mock_entities.csv"', 'os.path.join(data_dir, "mock_entities.csv")')
text = text.replace('"data/mock_assets.csv"', 'os.path.join(data_dir, "mock_assets.csv")')
text = text.replace('"data/mock_alerts.csv"', 'os.path.join(data_dir, "mock_alerts.csv")')
text = text.replace('"data/mock_cases.csv"', 'os.path.join(data_dir, "mock_cases.csv")')
text = text.replace('"data/ground_truth.json"', 'os.path.join(data_dir, "ground_truth.json")')

with open('backend/generate_mock_data.py', 'w', encoding='utf-8') as f:
    f.write(text)
