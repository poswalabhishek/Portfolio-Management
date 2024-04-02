labels = {0:'neutral', 1:'positive',2:'negative'}
vocab = "finance-uncased"
vocab_path = 'analyst_tone/vocab'
pretrained_weights_path = "analyst_tone/pretrained_weights" # this is pre-trained FinBERT weights
fine_tuned_weight_path = "analyst_tone/fine_tuned.pth"      # this is fine-tuned FinBERT weights
max_seq_length=64

# can change according to deployment's compute
device='cpu'
batch_size=8 # adjust based on available memory (64 for ~8GB vram)
