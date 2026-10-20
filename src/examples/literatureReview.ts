import { makePoint, type Tree } from '../model/tree';

type Topic = 'NLP' | 'Vision' | 'Generative' | 'RL' | 'Training' | 'Graphs' | 'Multimodal' | 'Science' | 'Architecture';

const TOPIC_COLOR: Record<Topic, string> = {
  NLP: '#bfdbfe',
  Vision: '#bbf7d0',
  Generative: '#fbcfe8',
  RL: '#fed7aa',
  Training: '#e5e7eb',
  Graphs: '#ddd6fe',
  Multimodal: '#a5f3fc',
  Science: '#fde68a',
  Architecture: '#fecaca',
};

// [short title, full title, authors, venue, topic, summary]
type Paper = [string, string, string, string, Topic, string];

const PAPERS: Record<number, Paper[]> = {
  2012: [
    ['AlexNet', 'ImageNet Classification with Deep Convolutional Neural Networks', 'Krizhevsky, Sutskever, Hinton', 'NeurIPS 2012', 'Vision', 'GPU-trained CNN that won ImageNet by a wide margin and started the deep learning boom.'],
    ['Dropout (preprint)', 'Improving neural networks by preventing co-adaptation of feature detectors', 'Hinton et al.', 'arXiv 2012', 'Training', 'Randomly drops units during training to reduce overfitting.'],
  ],
  2013: [
    ['word2vec', 'Efficient Estimation of Word Representations in Vector Space', 'Mikolov, Chen, Corrado, Dean', 'ICLR Workshop 2013', 'NLP', 'Skip-gram and CBOW models learn dense word vectors from large corpora.'],
    ['VAE', 'Auto-Encoding Variational Bayes', 'Kingma, Welling', 'arXiv 2013 / ICLR 2014', 'Generative', 'Reparameterization trick makes latent-variable models trainable by gradient descent.'],
    ['DQN (Atari)', 'Playing Atari with Deep Reinforcement Learning', 'Mnih et al.', 'NeurIPS Workshop 2013', 'RL', 'Q-learning with a CNN learns to play Atari games from raw pixels.'],
  ],
  2014: [
    ['GAN', 'Generative Adversarial Nets', 'Goodfellow et al.', 'NeurIPS 2014', 'Generative', 'Generator and discriminator trained against each other in a minimax game.'],
    ['Seq2Seq', 'Sequence to Sequence Learning with Neural Networks', 'Sutskever, Vinyals, Le', 'NeurIPS 2014', 'NLP', 'Encoder-decoder LSTMs for machine translation.'],
    ['Attention (NMT)', 'Neural Machine Translation by Jointly Learning to Align and Translate', 'Bahdanau, Cho, Bengio', 'arXiv 2014 / ICLR 2015', 'NLP', 'Introduces soft attention so the decoder can look back at all source positions.'],
    ['Adam', 'Adam: A Method for Stochastic Optimization', 'Kingma, Ba', 'arXiv 2014 / ICLR 2015', 'Training', 'Adaptive moment estimation; became the default optimizer.'],
    ['VGG', 'Very Deep Convolutional Networks for Large-Scale Image Recognition', 'Simonyan, Zisserman', 'arXiv 2014 / ICLR 2015', 'Vision', 'Shows depth with small 3x3 filters improves accuracy.'],
  ],
  2015: [
    ['ResNet', 'Deep Residual Learning for Image Recognition', 'He, Zhang, Ren, Sun', 'arXiv 2015 / CVPR 2016', 'Vision', 'Residual connections make networks with 100+ layers trainable.'],
    ['BatchNorm', 'Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift', 'Ioffe, Szegedy', 'ICML 2015', 'Training', 'Normalizes activations per mini-batch for faster, more stable training.'],
    ['U-Net', 'U-Net: Convolutional Networks for Biomedical Image Segmentation', 'Ronneberger, Fischer, Brox', 'MICCAI 2015', 'Vision', 'Encoder-decoder with skip connections for precise segmentation.'],
    ['Faster R-CNN', 'Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks', 'Ren, He, Girshick, Sun', 'NeurIPS 2015', 'Vision', 'Learned region proposals make two-stage detection fast.'],
    ['DQN (Nature)', 'Human-level control through deep reinforcement learning', 'Mnih et al.', 'Nature 2015', 'RL', 'Experience replay and target networks reach human level on many Atari games.'],
  ],
  2016: [
    ['AlphaGo', 'Mastering the game of Go with deep neural networks and tree search', 'Silver et al.', 'Nature 2016', 'RL', 'Policy and value networks plus MCTS beat a professional Go player.'],
    ['YOLO', 'You Only Look Once: Unified, Real-Time Object Detection', 'Redmon, Divvala, Girshick, Farhadi', 'CVPR 2016', 'Vision', 'Single-pass detector that frames detection as regression.'],
    ['LayerNorm', 'Layer Normalization', 'Ba, Kiros, Hinton', 'arXiv 2016', 'Training', 'Normalizes across features instead of the batch; key for RNNs and Transformers.'],
    ['WaveNet', 'WaveNet: A Generative Model for Raw Audio', 'van den Oord et al.', 'arXiv 2016', 'Generative', 'Dilated causal convolutions generate realistic raw audio.'],
    ['GCN', 'Semi-Supervised Classification with Graph Convolutional Networks', 'Kipf, Welling', 'arXiv 2016 / ICLR 2017', 'Graphs', 'Simple spectral-inspired convolution for graph-structured data.'],
  ],
  2017: [
    ['Transformer', 'Attention Is All You Need', 'Vaswani et al.', 'NeurIPS 2017', 'Architecture', 'Self-attention replaces recurrence; foundation of modern language models.'],
    ['PPO', 'Proximal Policy Optimization Algorithms', 'Schulman et al.', 'arXiv 2017', 'RL', 'Clipped policy-gradient objective that is simple and stable.'],
    ['Mask R-CNN', 'Mask R-CNN', 'He, Gkioxari, Dollár, Girshick', 'ICCV 2017', 'Vision', 'Adds a mask branch to Faster R-CNN for instance segmentation.'],
    ['AlphaGo Zero', 'Mastering the game of Go without human knowledge', 'Silver et al.', 'Nature 2017', 'RL', 'Learns Go purely from self-play, surpassing AlphaGo.'],
    ['WGAN', 'Wasserstein Generative Adversarial Networks', 'Arjovsky, Chintala, Bottou', 'ICML 2017', 'Generative', 'Earth-mover distance gives GANs more stable training.'],
  ],
  2018: [
    ['BERT', 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', 'Devlin, Chang, Lee, Toutanova', 'arXiv 2018 / NAACL 2019', 'NLP', 'Masked-language-model pretraining; fine-tunes to many tasks.'],
    ['GPT', 'Improving Language Understanding by Generative Pre-Training', 'Radford, Narasimhan, Salimans, Sutskever', 'OpenAI 2018', 'NLP', 'Generative pretraining of a Transformer decoder, then fine-tuning.'],
    ['ELMo', 'Deep contextualized word representations', 'Peters et al.', 'NAACL 2018', 'NLP', 'Contextual word embeddings from a bidirectional LSTM language model.'],
    ['GAT', 'Graph Attention Networks', 'Veličković et al.', 'ICLR 2018', 'Graphs', 'Attention weights over neighbours for graph learning.'],
    ['StyleGAN', 'A Style-Based Generator Architecture for Generative Adversarial Networks', 'Karras, Laine, Aila', 'arXiv 2018 / CVPR 2019', 'Generative', 'Style-based generator gives controllable, high-quality faces.'],
  ],
  2019: [
    ['GPT-2', 'Language Models are Unsupervised Multitask Learners', 'Radford et al.', 'OpenAI 2019', 'NLP', 'Larger language model shows zero-shot task ability.'],
    ['EfficientNet', 'EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks', 'Tan, Le', 'ICML 2019', 'Vision', 'Compound scaling of depth, width and resolution.'],
    ['RoBERTa', 'RoBERTa: A Robustly Optimized BERT Pretraining Approach', 'Liu et al.', 'arXiv 2019', 'NLP', 'Better training recipe makes BERT significantly stronger.'],
    ['T5', 'Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer', 'Raffel et al.', 'arXiv 2019 / JMLR 2020', 'NLP', 'Casts every NLP task as text-to-text.'],
    ['MuZero', 'Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model', 'Schrittwieser et al.', 'arXiv 2019 / Nature 2020', 'RL', 'Plans with a learned model without knowing the game rules.'],
  ],
  2020: [
    ['GPT-3', 'Language Models are Few-Shot Learners', 'Brown et al.', 'NeurIPS 2020', 'NLP', '175B-parameter model does tasks from a few examples in the prompt.'],
    ['ViT', 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale', 'Dosovitskiy et al.', 'arXiv 2020 / ICLR 2021', 'Vision', 'Plain Transformer on image patches rivals CNNs at scale.'],
    ['DDPM', 'Denoising Diffusion Probabilistic Models', 'Ho, Jain, Abbeel', 'NeurIPS 2020', 'Generative', 'Diffusion models reach high image quality.'],
    ['SimCLR', 'A Simple Framework for Contrastive Learning of Visual Representations', 'Chen, Kornblith, Norouzi, Hinton', 'ICML 2020', 'Vision', 'Contrastive self-supervised learning with strong augmentations.'],
    ['Scaling Laws', 'Scaling Laws for Neural Language Models', 'Kaplan et al.', 'arXiv 2020', 'NLP', 'Loss falls as a power law in parameters, data and compute.'],
  ],
  2021: [
    ['CLIP', 'Learning Transferable Visual Models From Natural Language Supervision', 'Radford et al.', 'ICML 2021', 'Multimodal', 'Contrastive image-text pretraining enables zero-shot classification.'],
    ['AlphaFold 2', 'Highly accurate protein structure prediction with AlphaFold', 'Jumper et al.', 'Nature 2021', 'Science', 'Predicts protein structures at near-experimental accuracy.'],
    ['LoRA', 'LoRA: Low-Rank Adaptation of Large Language Models', 'Hu et al.', 'arXiv 2021 / ICLR 2022', 'Training', 'Fine-tunes large models by training small low-rank matrices.'],
    ['Latent Diffusion', 'High-Resolution Image Synthesis with Latent Diffusion Models', 'Rombach et al.', 'arXiv 2021 / CVPR 2022', 'Generative', 'Diffusion in a compressed latent space; basis of Stable Diffusion.'],
    ['Codex', 'Evaluating Large Language Models Trained on Code', 'Chen et al.', 'arXiv 2021', 'NLP', 'Code-trained GPT model and the HumanEval benchmark.'],
  ],
  2022: [
    ['InstructGPT', 'Training language models to follow instructions with human feedback', 'Ouyang et al.', 'NeurIPS 2022', 'NLP', 'RLHF aligns language models with user intent.'],
    ['Chinchilla', 'Training Compute-Optimal Large Language Models', 'Hoffmann et al.', 'NeurIPS 2022', 'NLP', 'Scale data and parameters together for compute-optimal training.'],
    ['Chain-of-Thought', 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models', 'Wei et al.', 'NeurIPS 2022', 'NLP', 'Prompting with worked reasoning steps improves multi-step problems.'],
    ['Flamingo', 'Flamingo: a Visual Language Model for Few-Shot Learning', 'Alayrac et al.', 'NeurIPS 2022', 'Multimodal', 'Interleaved image-text model that learns new tasks from a few examples.'],
    ['FlashAttention', 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', 'Dao et al.', 'NeurIPS 2022', 'Training', 'IO-aware attention kernel; faster and uses less memory.'],
  ],
  2023: [
    ['LLaMA', 'LLaMA: Open and Efficient Foundation Language Models', 'Touvron et al.', 'arXiv 2023', 'NLP', 'Openly released models competitive with much larger ones.'],
    ['Segment Anything', 'Segment Anything', 'Kirillov et al.', 'ICCV 2023', 'Vision', 'Promptable segmentation model trained on 1B masks.'],
    ['QLoRA', 'QLoRA: Efficient Finetuning of Quantized LLMs', 'Dettmers et al.', 'NeurIPS 2023', 'Training', 'Fine-tunes 4-bit quantized models with LoRA adapters.'],
    ['DPO', 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model', 'Rafailov et al.', 'NeurIPS 2023', 'NLP', 'Preference alignment without a separate reward model or RL loop.'],
    ['Mamba', 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces', 'Gu, Dao', 'arXiv 2023', 'Architecture', 'Selective state-space model as a fast alternative to attention.'],
  ],
};

/** Literature review: years on the main chain, each paper a leaf branching off its year. */
export function literatureReviewTree(): Tree {
  const years = Object.keys(PAPERS).map(Number);
  return {
    title: 'Literature review: deep learning 2012–2023',
    direction: 'LR',
    edgeStyle: 'sides',
    layout: 'packed',
    root: years.map((year) =>
      makePoint({
        title: String(year),
        content: `${PAPERS[year].length} papers`,
        color: '#ffffff',
        branches: PAPERS[year].map(([short, full, authors, venue, topic, summary]) => [
          makePoint({
            kind: 'leaf',
            title: short,
            content: `${full}\n${authors} · ${venue}\nTopic: ${topic}\n${summary}`,
            color: TOPIC_COLOR[topic],
          }),
        ]),
      }),
    ),
  };
}
