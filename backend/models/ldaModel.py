from gensim.utils import simple_preprocess
import gensim.corpora as corpora
from gensim.models import LdaModel
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn import decomposition

nltk.download('stopwords')
nltk.download('punkt')

stop_words = stopwords.words('english')

def sents_to_words(sentences):
    for sentence in sentences:
        yield(simple_preprocess(str(sentence), deacc=True))


        
def remove_stopwords(docs):
    refined_docs = []
    
    for doc in docs:
        refined_doc = []
        for word in simple_preprocess(str(doc)):
            if word not in stop_words and len(word) > 4:
                refined_doc.append(word)
        refined_docs.append(refined_doc)
        
    return refined_docs

def topic_modelled (lda, sentences, vectorizer_tf, W1, H1):
    
    colnames = ["Topic" + str(i) for i in range(lda.n_components)]
    docnames = ["Doc" + str(i) for i in range(len(sentences.summary))]
    df_doc_topic_train = pd.DataFrame(np.round(W1, 2), columns=colnames, index=docnames)
    significant_topic = np.argmax(df_doc_topic_train.values, axis=1)
    df_doc_topic_train['dominant_topic'] = significant_topic
    
    WHold = lda.transform(vectorizer_tf.transform(sentences))
    
    colnames = ["Topic" + str(i) for i in range(lda.n_components)]
    docnames = ["Doc" + str(i) for i in range(len(sentences))]
    df_doc_topic_test = pd.DataFrame(np.round(WHold, 2), columns=colnames, index=docnames)
    significant_topic = np.argmax(df_doc_topic_test.values, axis=1)
    df_doc_topic_test['dominant_topic'] = significant_topic

    return df_doc_topic_train, df_doc_topic_test

def tokenize (articles):
    stemmer = WordNetLemmatizer()
    tokens = [word for word in nltk.word_tokenize(articles) if (len(word) > 4) ] 
    stems = [stemmer.lemmatize(item) for item in tokens]
    return stems

def advanced_lda_model (sentences, num_topic_words = 10, num_topics = 10):
    
    vectorizer_tf = TfidfVectorizer(tokenizer = tokenize, stop_words = 'english',\
                                    max_features = 1000, use_idf = False, norm = None)
    tf_vectors = vectorizer_tf.fit_transform(sentences) 
    
    lda = decomposition.LatentDirichletAllocation(n_components = num_topics,\
                                              max_iter = 3, learning_method = 'online',\
                                              learning_offset = 50, n_jobs = -1, random_state=4201)
    
    W1 = lda.fit_transform(tf_vectors)
    H1 = lda.components_
    vocab = np.array(vectorizer_tf.get_feature_names())

    top_words = lambda t: [vocab[i] for i in np.argsort(t)[:-num_topic_words-1:-1]]
    topic_words = ([top_words(t) for t in H1])
    topics = [' '.join(t) for t in topic_words]
    
    return topics

def get_lda(sentences, num_topics=20):
    if len(sentences) == 0:
        return None
    docs = list(sents_to_words(sentences))

    docs = remove_stopwords(docs)
    id2word = corpora.Dictionary(docs)

    id2word.filter_extremes(no_above=0.25)
    corpus = [id2word.doc2bow(doc) for doc in docs]

    lda_model = LdaModel(corpus=corpus,
                            id2word=id2word,
                            num_topics=num_topics,
                            passes=10)
    return lda_model