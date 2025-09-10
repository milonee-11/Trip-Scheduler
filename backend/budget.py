import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
import seaborn as sns
import json
import joblib
import warnings
warnings.filterwarnings('ignore')

class TravelBudgetPredictor:
    def __init__(self, n_clusters=5):
        self.n_clusters = n_clusters
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        self.scaler = StandardScaler()
        self.is_fitted = False
        
    def prepare_data(self, user_data):
        """
        Prepare user data for clustering
        """
        features = []
        
        for user in user_data:
            # Extract features from user data
            feature_vector = [
                user.get('initial_budget', 0),
                user.get('accommodation_total', 0),
                user.get('attractions_total', 0),
                user.get('food_total', 0),
                user.get('transport_total', 0),
                user.get('days', 1),
                user.get('misc_total', 0),
                user.get('food_preference', 1),  # 1: budget, 2: mid-range, 3: luxury
                user.get('transport_type', 1),   # 1: public, 2: rental, 3: taxis, 4: luxury
            ]
            
            # Add miscellaneous expenses if available
            misc = user.get('miscellaneous', {})
            if isinstance(misc, dict):
                feature_vector.extend([
                    misc.get('shopping', 0),
                    misc.get('clubbing', 0),
                    misc.get('souvenirs', 0),
                    misc.get('emergencies', 0),
                    misc.get('others', 0)
                ])
            else:
                # If miscellaneous is a single value (old format)
                feature_vector.extend([misc if misc else 0, 0, 0, 0, 0])
                
            features.append(feature_vector)
            
        return np.array(features)
    
    def fit(self, user_data):
        """
        Fit the K-Means model with user data
        """
        # Prepare data
        X = self.prepare_data(user_data)
        
        # Scale the features
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit K-Means
        self.kmeans.fit(X_scaled)
        
        # Calculate silhouette score to evaluate clustering
        labels = self.kmeans.labels_
        score = silhouette_score(X_scaled, labels)
        print(f"Silhouette Score: {score:.3f}")
        
        self.is_fitted = True
        self.cluster_centers_ = self.kmeans.cluster_centers_
        
        return self
    
    def predict_cluster(self, user_data):
        """
        Predict which cluster a user belongs to
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
            
        # Prepare data for the user
        X = self.prepare_data([user_data])
        
        # Scale the features
        X_scaled = self.scaler.transform(X)
        
        # Predict cluster
        cluster = self.kmeans.predict(X_scaled)[0]
        
        return cluster
    
    def get_cluster_stats(self, user_data, cluster_id):
        """
        Get statistics for a specific cluster
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
            
        # Prepare all data
        X = self.prepare_data(user_data)
        
        # Get labels for all users
        X_scaled = self.scaler.transform(X)
        labels = self.kmeans.predict(X_scaled)
        
        # Filter users in the specified cluster
        cluster_users = [user for i, user in enumerate(user_data) if labels[i] == cluster_id]
        
        if not cluster_users:
            return None
            
        # Calculate statistics for the cluster
        stats = {
            'cluster_id': cluster_id,
            'num_users': len(cluster_users),
            'avg_initial_budget': np.mean([u.get('initial_budget', 0) for u in cluster_users]),
            'avg_accommodation': np.mean([u.get('accommodation_total', 0) for u in cluster_users]),
            'avg_attractions': np.mean([u.get('attractions_total', 0) for u in cluster_users]),
            'avg_food': np.mean([u.get('food_total', 0) for u in cluster_users]),
            'avg_transport': np.mean([u.get('transport_total', 0) for u in cluster_users]),
            'avg_misc': np.mean([u.get('misc_total', 0) for u in cluster_users]),
            'common_food_preference': max(set([u.get('food_preference', 1) for u in cluster_users]), 
                                        key=[u.get('food_preference', 1) for u in cluster_users].count),
            'common_transport_type': max(set([u.get('transport_type', 1) for u in cluster_users]), 
                                       key=[u.get('transport_type', 1) for u in cluster_users].count)
        }
        
        return stats
    
    def recommend_budget(self, user_data, target_user):
        """
        Recommend budget based on similar users in the same cluster
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
            
        # Predict which cluster the target user belongs to
        cluster_id = self.predict_cluster(target_user)
        
        # Get statistics for that cluster
        stats = self.get_cluster_stats(user_data, cluster_id)
        
        if not stats:
            return None
            
        # Create recommendations based on cluster averages
        recommendations = {
            'recommended_accommodation': stats['avg_accommodation'],
            'recommended_attractions': stats['avg_attractions'],
            'recommended_food_per_day': stats['avg_food'] / max(target_user.get('days', 1), 1),
            'recommended_transport_per_day': stats['avg_transport'] / max(target_user.get('days', 1), 1),
            'recommended_misc': stats['avg_misc'],
            'food_preference_recommendation': self.get_food_preference_name(stats['common_food_preference']),
            'transport_type_recommendation': self.get_transport_type_name(stats['common_transport_type']),
            'cluster_profile': self.get_cluster_profile(cluster_id)
        }
        
        return recommendations
    
    def get_food_preference_name(self, preference_id):
        preferences = {
            1: "Budget Eats (₹200-500/day)",
            2: "Mid-Range (₹500-1000/day)",
            3: "Luxury (₹1000+/day)"
        }
        return preferences.get(preference_id, "Unknown")
    
    def get_transport_type_name(self, transport_id):
        transport_types = {
            1: "Public Transport (₹50-200/day)",
            2: "Rental Vehicle (₹500-1500/day)",
            3: "Taxis (₹300-1000/day)",
            4: "Luxury Transport (₹1500+/day)"
        }
        return transport_types.get(transport_id, "Unknown")
    
    def get_cluster_profile(self, cluster_id):
        profiles = {
            0: "Budget Travelers - Focus on low-cost options",
            1: "Mid-Range Travelers - Balance between cost and comfort",
            2: "Luxury Travelers - Premium experiences regardless of cost",
            3: "Experience Seekers - Higher spending on attractions and activities",
            4: "Comfort Seekers - Higher spending on accommodation and transport"
        }
        return profiles.get(cluster_id, "Unknown profile")
    
    def visualize_clusters(self, user_data):
        """
        Create visualizations of the clusters
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
            
        # Prepare data
        X = self.prepare_data(user_data)
        X_scaled = self.scaler.transform(X)
        labels = self.kmeans.predict(X_scaled)
        
        # Reduce dimensions for visualization (using PCA)
        from sklearn.decomposition import PCA
        pca = PCA(n_components=2)
        X_reduced = pca.fit_transform(X_scaled)
        
        # Create scatter plot
        plt.figure(figsize=(10, 8))
        scatter = plt.scatter(X_reduced[:, 0], X_reduced[:, 1], c=labels, cmap='viridis', alpha=0.7)
        plt.colorbar(scatter, label='Cluster')
        plt.xlabel('PCA Component 1')
        plt.ylabel('PCA Component 2')
        plt.title('Travel Budget Clusters')
        plt.show()
        
        # Create boxplots for each cluster's budget distribution
        budgets = [u.get('initial_budget', 0) for u in user_data]
        cluster_budgets = [[] for _ in range(self.n_clusters)]
        
        for i, budget in enumerate(budgets):
            cluster_budgets[labels[i]].append(budget)
        
        plt.figure(figsize=(12, 6))
        plt.boxplot(cluster_budgets)
        plt.xticks(range(1, self.n_clusters+1), [f'Cluster {i}' for i in range(self.n_clusters)])
        plt.ylabel('Initial Budget (₹)')
        plt.title('Budget Distribution by Cluster')
        plt.grid(True, alpha=0.3)
        plt.show()
        
        return X_reduced, labels

# Example usage and data simulation
def simulate_user_data(num_users=100):
    """
    Simulate user data for demonstration
    """
    users = []
    
    for i in range(num_users):
        # Randomly determine traveler type
        traveler_type = np.random.choice(['budget', 'mid-range', 'luxury', 'experience', 'comfort'], 
                                        p=[0.3, 0.4, 0.1, 0.1, 0.1])
        
        if traveler_type == 'budget':
            initial_budget = np.random.randint(10000, 30000)
            accommodation = initial_budget * np.random.uniform(0.2, 0.4)
            attractions = initial_budget * np.random.uniform(0.1, 0.2)
            food_per_day = np.random.randint(200, 500)
            transport_per_day = np.random.randint(50, 200)
            food_preference = 1
            transport_type = 1
        elif traveler_type == 'mid-range':
            initial_budget = np.random.randint(25000, 60000)
            accommodation = initial_budget * np.random.uniform(0.3, 0.5)
            attractions = initial_budget * np.random.uniform(0.15, 0.25)
            food_per_day = np.random.randint(500, 1000)
            transport_per_day = np.random.randint(200, 500)
            food_preference = 2
            transport_type = np.random.choice([1, 2, 3], p=[0.3, 0.4, 0.3])
        elif traveler_type == 'luxury':
            initial_budget = np.random.randint(50000, 150000)
            accommodation = initial_budget * np.random.uniform(0.4, 0.6)
            attractions = initial_budget * np.random.uniform(0.2, 0.3)
            food_per_day = np.random.randint(1000, 3000)
            transport_per_day = np.random.randint(1000, 3000)
            food_preference = 3
            transport_type = 4
        elif traveler_type == 'experience':
            initial_budget = np.random.randint(30000, 80000)
            accommodation = initial_budget * np.random.uniform(0.2, 0.3)
            attractions = initial_budget * np.random.uniform(0.3, 0.5)
            food_per_day = np.random.randint(300, 800)
            transport_per_day = np.random.randint(100, 300)
            food_preference = np.random.choice([1, 2], p=[0.6, 0.4])
            transport_type = np.random.choice([1, 2], p=[0.7, 0.3])
        else:  # comfort seekers
            initial_budget = np.random.randint(40000, 90000)
            accommodation = initial_budget * np.random.uniform(0.4, 0.6)
            attractions = initial_budget * np.random.uniform(0.1, 0.2)
            food_per_day = np.random.randint(800, 1500)
            transport_per_day = np.random.randint(500, 1500)
            food_preference = np.random.choice([2, 3], p=[0.7, 0.3])
            transport_type = np.random.choice([2, 3, 4], p=[0.4, 0.4, 0.2])
        
        # Generate random trip duration (1-14 days)
        days = np.random.randint(1, 15)
        
        # Calculate totals
        food_total = food_per_day * days
        transport_total = transport_per_day * days
        
        # Generate miscellaneous expenses
        miscellaneous = {
            'shopping': np.random.randint(0, initial_budget * 0.1),
            'clubbing': np.random.randint(0, initial_budget * 0.05),
            'souvenirs': np.random.randint(0, initial_budget * 0.03),
            'emergencies': np.random.randint(0, initial_budget * 0.07),
            'others': np.random.randint(0, initial_budget * 0.05)
        }
        misc_total = sum(miscellaneous.values())
        
        user = {
            'user_id': i + 1,
            'initial_budget': initial_budget,
            'accommodation_total': accommodation,
            'attractions_total': attractions,
            'food_total': food_total,
            'transport_total': transport_total,
            'misc_total': misc_total,
            'miscellaneous': miscellaneous,
            'days': days,
            'food_preference': food_preference,
            'transport_type': transport_type,
            'traveler_type': traveler_type  # For evaluation, not used in clustering
        }
        
        users.append(user)
    
    return users

def main():
    # Simulate user data
    print("Generating simulated user data...")
    users = simulate_user_data(200)
    
    # Initialize and fit the model
    print("Training K-Means model...")
    predictor = TravelBudgetPredictor(n_clusters=5)
    predictor.fit(users)
    
    # Visualize clusters
    print("Generating visualizations...")
    predictor.visualize_clusters(users)
    
    # Create a sample new user for prediction
    new_user = {
        'initial_budget': 45000,
        'accommodation_total': 15000,
        'attractions_total': 8000,
        'food_total': 6000,  # For 5 days = 1200/day
        'transport_total': 4000,  # For 5 days = 800/day
        'misc_total': 3000,
        'miscellaneous': {
            'shopping': 1500,
            'clubbing': 500,
            'souvenirs': 500,
            'emergencies': 300,
            'others': 200
        },
        'days': 5,
        'food_preference': 2,  # Mid-range
        'transport_type': 2   # Rental vehicle
    }
    
    # Get recommendations for the new user
    print("\nGenerating recommendations for new user...")
    recommendations = predictor.recommend_budget(users, new_user)
    
    if recommendations:
        print("\n=== BUDGET RECOMMENDATIONS ===")
        print(f"Recommended accommodation: ₹{recommendations['recommended_accommodation']:,.2f}")
        print(f"Recommended attractions: ₹{recommendations['recommended_attractions']:,.2f}")
        print(f"Recommended food per day: ₹{recommendations['recommended_food_per_day']:,.2f}")
        print(f"Recommended transport per day: ₹{recommendations['recommended_transport_per_day']:,.2f}")
        print(f"Recommended miscellaneous: ₹{recommendations['recommended_misc']:,.2f}")
        print(f"Food preference: {recommendations['food_preference_recommendation']}")
        print(f"Transport type: {recommendations['transport_type_recommendation']}")
        print(f"Cluster profile: {recommendations['cluster_profile']}")
    
    # Show statistics for all clusters
    print("\n=== CLUSTER STATISTICS ===")
    for cluster_id in range(predictor.n_clusters):
        stats = predictor.get_cluster_stats(users, cluster_id)
        if stats:
            print(f"\nCluster {cluster_id} ({stats['num_users']} users):")
            print(f"  Average initial budget: ₹{stats['avg_initial_budget']:,.2f}")
            print(f"  Average accommodation: ₹{stats['avg_accommodation']:,.2f}")
            print(f"  Average attractions: ₹{stats['avg_attractions']:,.2f}")
            print(f"  Average food: ₹{stats['avg_food']:,.2f}")
            print(f"  Average transport: ₹{stats['avg_transport']:,.2f}")
            print(f"  Average miscellaneous: ₹{stats['avg_misc']:,.2f}")
            print(f"  Common food preference: {predictor.get_food_preference_name(stats['common_food_preference'])}")
            print(f"  Common transport type: {predictor.get_transport_type_name(stats['common_transport_type'])}")

if __name__ == "__main__":
    main()