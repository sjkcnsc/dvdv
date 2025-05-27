import pandas as pd
import matplotlib.pyplot as plt
from sklearn.tree import plot_tree

from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# تحميل البيانات
df = pd.read_csv("full_game_data.csv")

# إنشاء العمود الهدف: is_near_loss
df['is_near_loss'] = df['EmptyTiles'].apply(lambda x: 1 if x <= 3 else 0)

# تجهيز الميزات (X) والهدف (y)
X = df[['Score', 'MaxTile', 'MoveTime(ms)', 'EmptyTiles']]
y = df['is_near_loss']

# تقسيم البيانات لتدريب واختبار
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# تدريب النموذج
model = DecisionTreeClassifier(max_depth=4, random_state=42)
model.fit(X_train, y_train)
# رسم شجرة القرار
plt.figure(figsize=(16, 8))
plot_tree(model, 
          feature_names=['Score', 'MaxTile', 'MoveTime(ms)', 'EmptyTiles'], 
          class_names=['Not Near Loss', 'Near Loss'],
          filled=True)
plt.title("Decision Tree - Near Loss Prediction")
plt.show()


# التنبؤ والنتائج
y_pred = model.predict(X_test)

print("🎯 تقرير التصنيف:")
print(classification_report(y_test, y_pred))
print("✅ دقة النموذج:", accuracy_score(y_test, y_pred))
import joblib

# حفظ النموذج في ملف
joblib.dump(model, "near_loss_model.pkl")
print("✅ النموذج تم حفظه!")
