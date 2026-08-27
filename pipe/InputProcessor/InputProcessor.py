from abc import ABC, abstractmethod


class InputProcessor(ABC):
    ''' 
    Abstract class for input processors. 
    All input processors should inherit from this class.  
    '''
    @abstractmethod
    def process_input(self, input):
        pass
    
    @abstractmethod
    def validate_input(self, input):
        pass