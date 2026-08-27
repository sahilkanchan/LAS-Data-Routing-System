from abc import ABC, abstractmethod


class DataClassifier(ABC):
    ''' 
    Abstract class for data classifiers. 
    All data classifiers should inherit from this class.  
    '''
    @abstractmethod
    def classify_data(self, data):
        pass
    